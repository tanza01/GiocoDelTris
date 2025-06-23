import { useState } from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import styles from './RiconoscimentiStyles.js';

/**
 * Riconoscimenti – Documentazione
 *
 * Questo componente React Native mostra la schermata dei riconoscimenti dell'applicazione.
 * Visualizza informazioni sull'autore, ringraziamenti e il marchio registrato.
 * Permette di tornare alla schermata precedente tramite un pulsante.
 *
 * ---
 *
 * Props principali:
 * - navigation: Oggetto di navigazione per tornare indietro.
 *
 * UI:
 * - Titolo della schermata.
 * - Testo con informazioni sull'autore e ringraziamenti.
 * - Indicazione del marchio registrato "Tanza®".
 * - Pulsante "Torna indietro" per tornare alla schermata precedente.
 *
 * Note aggiuntive:
 * - Gli stili sono definiti in RiconoscimentiStyles.js.
 * - Il componente è pensato per essere una schermata informativa statica.
 *
 * In sintesi:
 * Gestisce la visualizzazione dei riconoscimenti e delle informazioni sull'autore dell'app.
 <View style={styles.overlay}>
          <View style={styles.overlayContent}>
           <Image
              source={require('../../assets/Tanza.png')}
              style={styles.image}
              resizeMode="contain"
            />
            <Pressable onPress={() => setModalVisible(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Chiudi</Text>
            </Pressable>
          </View>
        </View> 
*/

const Riconoscimenti = ({ navigation }) => {
  const [clickCount, setClickCount] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);

  const handleTanzaPress = () => {
    if (clickCount + 1 === 10) {
      setModalVisible(true);
      setClickCount(0);
    } else {
      setClickCount(clickCount + 1);
    }
  };

  return (
    <View style={styles.container}>
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
       
      </Modal>
      <Text style={styles.title}>Riconoscimenti</Text>
      <Text style={styles.text}>
        Questa app è stata ideata, progettata e sviluppata da Tanza®.
        Grazie a tutti coloro che hanno contribuito con idee, feedback e supporto.
      </Text>
      <Text style={styles.trademark}>
        <Text
          style={styles.trademarkBold}
          onPress={handleTanzaPress}
        >
          Tanza®
        </Text>{' '}
        è un marchio registrato.
      </Text>
      <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
        <Text style={styles.buttonText}>Torna indietro</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Riconoscimenti;
