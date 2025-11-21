import React from 'react';
import { View, Image, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface PhotoPreviewProps {
  photoPath: string;
  onRetake: () => void;
}

const PhotoPreview: React.FC<PhotoPreviewProps> = ({ photoPath, onRetake }) => {
  return (
    <View style={styles.container}>
      <Image
        source={{ uri: `file://${photoPath}` }}
        style={styles.image}
        resizeMode="contain"
      />
      <TouchableOpacity style={styles.button} onPress={onRetake}>
        <Text style={styles.buttonText}>Retake</Text>
      </TouchableOpacity>
    </View>
  );
};

export default PhotoPreview;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  image: { width: '100%', height: '80%' },
  button: { marginTop: 20, backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  buttonText: { color: '#000', fontWeight: 'bold' },
});
