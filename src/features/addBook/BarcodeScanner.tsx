import React, { useRef, useState } from 'react';
import { Modal, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

import { ScreenContainer, ThemedText, Button, CenteredMessage } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Full-screen modal that scans an ISBN (EAN-13/EAN-8) barcode and returns the
 * decoded value once. Handles the camera-permission flow inline.
 */
export function BarcodeScanner({
  visible,
  onClose,
  onScanned,
}: {
  visible: boolean;
  onClose: () => void;
  onScanned: (isbn: string) => void;
}) {
  const theme = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const handledRef = useRef(false);
  const [scanning, setScanning] = useState(true);

  function handleBarcode(data: string) {
    if (handledRef.current) return;
    handledRef.current = true;
    setScanning(false);
    onScanned(data);
  }

  function close() {
    handledRef.current = false;
    setScanning(true);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <ScreenContainer edges={['top', 'bottom', 'left', 'right']}>
        {!permission ? (
          <CenteredMessage title="Preparing camera…" />
        ) : !permission.granted ? (
          <View style={{ flex: 1, justifyContent: 'center', padding: theme.spacing.xl, gap: theme.spacing.lg }}>
            <CenteredMessage
              title="Camera access needed"
              message="To scan a book's barcode we need permission to use the camera."
            />
            <Button title="Grant camera access" onPress={requestPermission} />
            <Button title="Cancel" variant="ghost" onPress={close} />
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <CameraView
              style={{ flex: 1 }}
              barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a'] }}
              onBarcodeScanned={scanning ? ({ data }) => handleBarcode(data) : undefined}
            />
            <View style={{ position: 'absolute', top: theme.spacing.xl, left: 0, right: 0, alignItems: 'center' }}>
              <ThemedText variant="subheading" color="#FFFFFF">
                Point at the book’s barcode
              </ThemedText>
            </View>
            <View style={{ position: 'absolute', bottom: theme.spacing.xl, left: theme.spacing.xl, right: theme.spacing.xl }}>
              <Button title="Cancel" variant="secondary" onPress={close} />
            </View>
          </View>
        )}
      </ScreenContainer>
    </Modal>
  );
}
