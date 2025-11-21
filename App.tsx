import React, { useEffect, useRef, useState } from 'react';
import 'react-native-worklets-core';
import { isFrameProcessorAvailable } from 'react-native-vision-camera';
import { StyleSheet, View, Text, Alert, TouchableOpacity } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useFrameProcessor,
  CameraProps,
} from 'react-native-vision-camera';
import Reanimated, {
  useAnimatedProps,
  useSharedValue,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { labelImage } from '@react-native-ml-kit/image-labeling';
import PhotoPreview from './PhotoPreview';

Reanimated.addWhitelistedNativeProps({ zoom: true });
const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera);

export default function App(): JSX.Element {
  const device = useCameraDevice('back', {
    physicalDevices: ['ultra-wide-angle-camera', 'wide-angle-camera', 'telephoto-camera'],
  });

  const { hasPermission, requestPermission } = useCameraPermission();
  const camera = useRef<Camera>(null);

  const zoom = useSharedValue(0);
  const zoomOffset = useSharedValue(0);

  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [detectedLabel, setDetectedLabel] = useState<string>('Detecting...');

  // 📱 Pinch zoom gesture
  const gesture = Gesture.Pinch()
    .onBegin(() => {
      zoomOffset.value = zoom.value;
    })
    .onUpdate(event => {
      if (!device) return;
      const z = zoomOffset.value * event.scale;
      zoom.value = interpolate(z, [1, 10], [device.minZoom, device.maxZoom], Extrapolation.CLAMP);
    });

  const animatedProps = useAnimatedProps<CameraProps>(() => ({ zoom: zoom.value }));

  useEffect(() => {
    if (!hasPermission) {
      requestPermission().then(result => {
        if (!result) Alert.alert('Permission Denied', 'Camera access is required.');
      });
    }
  }, [hasPermission, requestPermission]);

  // 🧠 Frame Processor for Labeling
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    const labels = labelImage(frame);
    if (labels.length > 0) {
      runOnJS(setDetectedLabel)(labels[0].label);
    }
  }, []);

  console.log('🧠 Frame Processors Available:', isFrameProcessorAvailable());

  // 📸 Capture photo
  const takePhoto = async () => {
    if (!camera.current) return;
    try {
      const photo = await camera.current.takePhoto();
      console.log('Photo taken:', photo.path);
      setPhotoPath(photo.path);
    } catch (error) {
      console.log('Error taking photo:', error);
    }
  };

  // 📋 Conditional views
  if (!hasPermission)
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>Camera permission required</Text>
      </View>
    );

  if (!device)
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>No camera device found</Text>
      </View>
    );

  if (photoPath) {
    return <PhotoPreview photoPath={photoPath} onRetake={() => setPhotoPath(null)} />;
  }

  // 🎥 Main camera view
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GestureDetector gesture={gesture}>
        <ReanimatedCamera
          ref={camera}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          photo={true}
          animatedProps={animatedProps}
          frameProcessor={frameProcessor}
          frameProcessorFps={5}
        />
      </GestureDetector>

      <View style={styles.labelContainer}>
        <Text style={styles.labelText}>{detectedLabel}</Text>
      </View>

      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.shutterButton} onPress={takePhoto} />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  text: { color: '#fff', fontSize: 16 },
  bottomContainer: { position: 'absolute', bottom: 40, width: '100%', alignItems: 'center' },
  shutterButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    borderWidth: 5,
    borderColor: '#000',
  },
  labelContainer: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 10,
    borderRadius: 10,
  },
  labelText: { color: '#fff', fontSize: 16 },
});
