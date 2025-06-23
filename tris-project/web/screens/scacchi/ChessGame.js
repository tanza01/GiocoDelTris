/**
 * ChessGame.js
 * -----------------------------------------------------------------------------
 * Schermata principale del gioco degli scacchi per React Native.
 * 
 * Funzionalità principali:
 * - Visualizzazione della scacchiera 8x8 con alternanza celle chiare/scure.
 * - Gestione di tutte le regole base degli scacchi: mosse di tutti i pezzi, promozione, arrocco, cattura.
 * - Evidenziazione delle mosse possibili quando si seleziona una pedina.
 * - Modalità Giocatore vs Giocatore e Giocatore vs Computer (CPU random).
 * - Riconoscimento di scacco matto e stallo, con navigazione alla schermata di vittoria.
 * - Stato della partita gestito tramite React hooks.
 * 
 * Stato e variabili principali:
 * - board: matrice 8x8 che rappresenta la scacchiera. Ogni cella contiene una stringa tipo "wP" (pedone bianco), "bK" (re nero), oppure null.
 * - currentPlayer: "w" (bianco) o "b" (nero), indica il giocatore attivo.
 * - selected: [row, col] della pedina selezionata, oppure null.
 * - highlightedMoves: array di stringhe "row,col" che rappresentano le celle evidenziate per le mosse possibili.
 * - kingMoved, rookMoved: oggetti che tengono traccia se re/torri si sono mossi (per abilitare/disabilitare l'arrocco).
 * - gameStarted: booleano che indica se la partita è iniziata (usato per triggerare il controllo di fine partita).
 * 
 * Funzioni principali:
 * - createInitialBoard(): restituisce la scacchiera iniziale.
 * - getPossibleMoves(): calcola tutte le mosse legali per un pezzo, inclusi arrocco e promozione.
 * - getAllPossibleMoves(): restituisce tutte le mosse possibili per un giocatore.
 * - isKingInCheck(): verifica se il re di un giocatore è sotto scacco.
 * - filterLegalMoves(): filtra le mosse che lascerebbero il proprio re sotto scacco.
 * - handleCellClick(): gestisce la selezione di una cella e l'eventuale mossa.
 * - handleMove(): esegue la mossa, aggiorna la scacchiera e lo stato (incluso arrocco e promozione).
 * - useEffect() per la CPU: fa muovere la CPU in modo casuale quando è il suo turno.
 * - useEffect() per la fine partita: controlla scacco matto/stallo e naviga alla schermata di vittoria.
 * - renderPiece(): restituisce il simbolo Unicode corretto per ogni pezzo.
 * 
 * Componenti UI:
 * - La scacchiera è renderizzata come una griglia di TouchableOpacity.
 * - Le celle selezionate sono evidenziate con un bordo verde.
 * - Le celle delle mosse possibili sono evidenziate in verde chiaro.
 * - Il turno corrente è mostrato sotto la scacchiera.
 * 
 * Arrocco:
 * - Consentito solo se né il re né la torre coinvolta si sono mai mossi.
 * - Le celle tra re e torre devono essere libere.
 * - Il re non deve essere sotto scacco, né attraversare o finire su una cella sotto attacco.
 * - L'arrocco viene eseguito spostando sia il re che la torre.
 * 
 * Promozione:
 * - Quando un pedone raggiunge l'ultima traversa, viene promosso automaticamente a regina.
 * 
 * Modalità CPU:
 * - In modalità "player-vs-computer", la CPU gioca mosse casuali tra quelle legali.
 * 
 * Navigazione:
 * - Al termine della partita (scacco matto o stallo), si viene portati alla schermata "ChessVictory" con i dettagli del risultato.
 * 
 * Dipendenze:
 * - React, React Native, React Navigation, ChessStyles.js per gli stili.
 * 
 * Personalizzazione:
 * - Puoi modificare i simboli Unicode dei pezzi nella funzione renderPiece.
 * - Gli stili della scacchiera e delle celle sono definiti in ChessStyles.js.
 * 
 * -----------------------------------------------------------------------------
 */

import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import styles from './ChessStyles.js';

const BOARD_SIZE = 8;

function createInitialBoard() {
  return [
    ["bR", "bN", "bB", "bQ", "bK", "bB", "bN", "bR"],
    ["bP", "bP", "bP", "bP", "bP", "bP", "bP", "bP"],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    ["wP", "wP", "wP", "wP", "wP", "wP", "wP", "wP"],
    ["wR", "wN", "wB", "wQ", "wK", "wB", "wN", "wR"],
  ];
}

function getOpponent(player) {
  return player === "w" ? "b" : "w";
}

function inBounds(row, col) {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

function getPossibleMoves(board, row, col, player, kingMovedArg, rookMovedArg) {
  const piece = board[row][col];
  if (!piece || piece[0] !== player) return [];
  const type = piece[1];
  const moves = [];
  const directions = {
    N: [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1]
    ],
    B: [
      [-1, -1], [-1, 1], [1, -1], [1, 1]
    ],
    R: [
      [-1, 0], [1, 0], [0, -1], [0, 1]
    ],
    Q: [
      [-1, -1], [-1, 1], [1, -1], [1, 1],
      [-1, 0], [1, 0], [0, -1], [0, 1]
    ],
    K: [
      [-1, -1], [-1, 1], [1, -1], [1, 1],
      [-1, 0], [1, 0], [0, -1], [0, 1]
    ]
  };

  if (type === "P") {
    const dir = player === "w" ? -1 : 1;
   
    if (inBounds(row + dir, col) && !board[row + dir][col]) {
      moves.push({ to: [row + dir, col], capture: null });
      
      if (
        (player === "w" && row === 6) ||
        (player === "b" && row === 1)
      ) {
        if (!board[row + dir * 2][col]) {
          moves.push({ to: [row + dir * 2, col], capture: null });
        }
      }
    }
    
    for (const dc of [-1, 1]) {
      const nr = row + dir, nc = col + dc;
      if (
        inBounds(nr, nc) &&
        board[nr][nc] &&
        board[nr][nc][0] === getOpponent(player)
      ) {
        moves.push({ to: [nr, nc], capture: [nr, nc] });
      }
    }
    
  } else if (type === "N") {
    for (const [dr, dc] of directions.N) {
      const nr = row + dr, nc = col + dc;
      if (inBounds(nr, nc)) {
        if (!board[nr][nc] || board[nr][nc][0] === getOpponent(player)) {
          moves.push({ to: [nr, nc], capture: board[nr][nc] ? [nr, nc] : null });
        }
      }
    }
  } else if (type === "B" || type === "R" || type === "Q") {
    const dirs = directions[type];
    for (const [dr, dc] of dirs) {
      let nr = row + dr, nc = col + dc;
      while (inBounds(nr, nc)) {
        if (!board[nr][nc]) {
          moves.push({ to: [nr, nc], capture: null });
        } else {
          if (board[nr][nc][0] === getOpponent(player)) {
            moves.push({ to: [nr, nc], capture: [nr, nc] });
          }
          break;
        }
        nr += dr;
        nc += dc;
        if (type === "K") break; 
      }
    }
  } else if (type === "K") {
    for (const [dr, dc] of directions.K) {
      const nr = row + dr, nc = col + dc;
      if (inBounds(nr, nc)) {
        if (!board[nr][nc] || board[nr][nc][0] === getOpponent(player)) {
          moves.push({ to: [nr, nc], capture: board[nr][nc] ? [nr, nc] : null });
        }
      }
    }
    const kingRow = player === "w" ? 7 : 0;
    const kingCol = 4;
    const rookCols = [0, 7];
    const rookMovedState = rookMovedArg || {};
    const kingMovedState = kingMovedArg || {};
    if (row === kingRow && col === kingCol && !kingMovedState[player]) {
      
      if (
        !rookMovedState[player + "7"] &&
        !board[kingRow][5] && !board[kingRow][6] &&
        board[kingRow][7] === player + "R"
      ) {
        
        const squares = [
          [kingRow, 4],
          [kingRow, 5],
          [kingRow, 6]
        ];
        const safe = squares.every(([r, c]) => {
          const tempBoard = board.map(row => [...row]);
          tempBoard[r][c] = player + "K";
          tempBoard[kingRow][4] = null;
          return !isKingInCheck(tempBoard, player);
        });
        if (safe) {
          moves.push({ to: [kingRow, 6], castling: "kingside" });
        }
      }
     
      if (
        !rookMovedState[player + "0"] &&
        !board[kingRow][1] && !board[kingRow][2] && !board[kingRow][3] &&
        board[kingRow][0] === player + "R"
      ) {
        const squares = [
          [kingRow, 4],
          [kingRow, 3],
          [kingRow, 2]
        ];
        const safe = squares.every(([r, c]) => {
          const tempBoard = board.map(row => [...row]);
          tempBoard[r][c] = player + "K";
          tempBoard[kingRow][4] = null;
          return !isKingInCheck(tempBoard, player);
        });
        if (safe) {
          moves.push({ to: [kingRow, 2], castling: "queenside" });
        }
      }
    }
  }
  return moves;
}


function getAllPossibleMoves(board, player, kingMovedArg, rookMovedArg) {
  const moves = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];
      if (piece && piece[0] === player) {
        const pm = getPossibleMoves(board, row, col, player, kingMovedArg, rookMovedArg);
        if (pm.length > 0) {
          moves.push({ from: [row, col], moves: pm });
        }
      }
    }
  }
  return moves;
}


function findKing(board, player) {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col] === player + "K") return [row, col];
    }
  }
  return null;
}


function isKingInCheck(board, player) {
  const kingPos = findKing(board, player);
  if (!kingPos) return true;
  const opponent = getOpponent(player);
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col] && board[row][col][0] === opponent) {
        const moves = getPossibleMoves(board, row, col, opponent, {}, {});
        if (moves.some(m => m.to[0] === kingPos[0] && m.to[1] === kingPos[1])) {
          return true;
        }
      }
    }
  }
  return false;
}


function filterLegalMoves(board, player, allMoves) {
  return allMoves
    .map(move => ({
      ...move,
      moves: move.moves.filter(m => {
        const newBoard = board.map(r => [...r]);
        const [fr, fc] = move.from;
        const [tr, tc] = m.to;
        newBoard[tr][tc] = newBoard[fr][fc];
        newBoard[fr][fc] = null;
        if (m.capture) {
          const [cr, cc] = m.capture;
          newBoard[cr][cc] = null;
        }
        return !isKingInCheck(newBoard, player);
      })
    }))
    .filter(move => move.moves.length > 0);
}

function ChessGame({ route }) {
  const navigation = useNavigation();
  const { player1, player2, mode } = route?.params || {};
  const [board, setBoard] = useState(createInitialBoard());
  const [currentPlayer, setCurrentPlayer] = useState("w");
  const [selected, setSelected] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [highlightedMoves, setHighlightedMoves] = useState([]);
  const [castlingRights, setCastlingRights] = useState({
    wK: true, wQ: true, bK: true, bQ: true
  });
  const [kingMoved, setKingMoved] = useState({ w: false, b: false });
  const [rookMoved, setRookMoved] = useState({
    w0: false, w7: false, b0: false, b7: false
  });

  useEffect(() => {
    setBoard(createInitialBoard());
    setSelected(null);
    setGameStarted(false);
    setCurrentPlayer("w");
  }, [mode, player1, player2]);

  useEffect(() => {
    if (
      mode === "player-vs-computer" &&
      currentPlayer === "b"
    ) {
      setTimeout(() => {
        const allMoves = filterLegalMoves(board, "b", getAllPossibleMoves(board, "b", kingMoved, rookMoved));
        if (allMoves.length === 0) return;
        const moveIdx = Math.floor(Math.random() * allMoves.length);
        const move = allMoves[moveIdx];
        const toIdx = Math.floor(Math.random() * move.moves.length);
        const { to, capture, castling } = move.moves[toIdx];
        handleMove(move.from, to, capture, true, castling || null);
      }, 700);
    }
    // eslint-disable-next-line
  }, [currentPlayer, mode, board]);

  function handleCellClick(row, col) {
    if (
      (mode === "player-vs-computer" && currentPlayer === "b")
    ) {
      return;
    }
    if (!selected) {
      if (
        board[row][col] &&
        board[row][col][0] === currentPlayer
      ) {
        setSelected([row, col]);
        const possible = filterLegalMoves(
          board,
          currentPlayer,
          [
            { from: [row, col], moves: getPossibleMoves(board, row, col, currentPlayer, kingMoved, rookMoved) }
          ]
        );
        if (possible.length > 0) {
          setHighlightedMoves(possible[0].moves.map(m => m.to.join(",")));
        } else {
          setHighlightedMoves([]);
        }
      }
    } else {
      const [selRow, selCol] = selected;
      if (selRow === row && selCol === col) {
        setSelected(null);
        setHighlightedMoves([]);
        return;
      }
      const possible = filterLegalMoves(
        board,
        currentPlayer,
        [
          { from: [selRow, selCol], moves: getPossibleMoves(board, selRow, selCol, currentPlayer, kingMoved, rookMoved) }
        ]
      );
      if (possible.length > 0) {
        const found = possible[0].moves.find(
          (m) => m.to[0] === row && m.to[1] === col
        );
        if (found) {
          handleMove([selRow, selCol], [row, col], found.capture, false, found.castling || null);
          setHighlightedMoves([]);
        } else {
          setSelected(null);
          setHighlightedMoves([]);
        }
      } else {
        setSelected(null);
        setHighlightedMoves([]);
      }
    }
  }

  function handleMove(from, to, capture, isCpu = false, castling = null) {
    setGameStarted(true);
    const newBoard = board.map((r) => [...r]);
    const [fr, fc] = from;
    const [tr, tc] = to;
    let piece = newBoard[fr][fc];

    // Promozione
    if (piece === "wP" && tr === 0) piece = "wQ";
    if (piece === "bP" && tr === BOARD_SIZE - 1) piece = "bQ";

    let newKingMoved = { ...kingMoved };
    let newRookMoved = { ...rookMoved };

    // Arrocco
    if (piece[1] === "K" && Math.abs(tc - fc) === 2) {
      if (tc === 6) {
        // Arrocco corto
        newBoard[tr][5] = newBoard[tr][7];
        newBoard[tr][7] = null;
        newRookMoved[piece[0] + "7"] = true;
      }
      if (tc === 2) {
        // Arrocco lungo
        newBoard[tr][3] = newBoard[tr][0];
        newBoard[tr][0] = null;
        newRookMoved[piece[0] + "0"] = true;
      }
      newKingMoved[piece[0]] = true;
    }

    // Aggiorna stato re e torri se si muovono normalmente
    if (piece[1] === "K") newKingMoved[piece[0]] = true;
    if (piece[1] === "R") {
      if (fr === 7 && fc === 0) newRookMoved["w0"] = true;
      if (fr === 7 && fc === 7) newRookMoved["w7"] = true;
      if (fr === 0 && fc === 0) newRookMoved["b0"] = true;
      if (fr === 0 && fc === 7) newRookMoved["b7"] = true;
    }

    // Cattura
    if (capture) {
      const [cr, cc] = capture;
      newBoard[cr][cc] = null;
    }

    newBoard[fr][fc] = null;
    newBoard[tr][tc] = piece;

    setBoard(newBoard);
    setKingMoved(newKingMoved);
    setRookMoved(newRookMoved);
    setSelected(null);
    setHighlightedMoves([]);
    setCurrentPlayer(getOpponent(currentPlayer));
  }

  useEffect(() => {
    if (!gameStarted) return;
    const allMoves = filterLegalMoves(board, currentPlayer, getAllPossibleMoves(board, currentPlayer, kingMoved, rookMoved));
    if (allMoves.length === 0) {
      if (isKingInCheck(board, currentPlayer)) {
        setTimeout(() => {
          navigation.replace("ChessVictory", {
            winner: getOpponent(currentPlayer) === "w" ? player1 : player2,
            player1,
            player2,
            mode,
            checkmate: true,
          });
        }, 100);
      } else {
        setTimeout(() => {
          navigation.replace("ChessVictory", {
            winner: "Stallo",
            player1,
            player2,
            mode,
            checkmate: false,
          });
        }, 100);
      }
    }
  }, [board, gameStarted, currentPlayer, navigation]);

  function renderPiece(piece, row) {
    if (!piece) return null;
    const map = {
      wK: "♔", wQ: "♕", wR: "♖", wB: "♗", wN: "♘", wP: "♙",
      bK: "♚", bQ: "♛", bR: "♜", bB: "♝", bN: "♞", bP: "♟",
    };
    return <Text style={piece[0] === "b" ? styles.pieceB : styles.pieceW}>{map[piece]}</Text>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.board}>
        {board.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((cell, colIndex) => {
              const isSelected = selected && selected[0] === rowIndex && selected[1] === colIndex;
              const isHighlighted = highlightedMoves.includes(`${rowIndex},${colIndex}`);
              const cellColor = (rowIndex + colIndex) % 2 === 0 ? styles.lightCell : styles.darkCell;
              return (
                <TouchableOpacity
                  key={colIndex}
                  style={[
                    styles.cell,
                    cellColor,
                    isSelected && styles.cellSelected,
                    isHighlighted && styles.cellHighlight
                  ]}
                  onPress={() => handleCellClick(rowIndex, colIndex)}
                >
                  {cell && renderPiece(cell, rowIndex)}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
      <View style={styles.info}>
        <Text style={styles.turn}>
          {`Turno di ${currentPlayer === "w" ? player1 : player2}`}
        </Text>
      </View>
    </View>
  );
}

export default ChessGame;