import { Camera, CameraType, requestCameraPermissionsAsync } from "expo-camera";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  FontAwesome,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { runModel } from "./replicate";

const CameraScreen = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraType, setCameraType] = useState(CameraType.back);
  const [camera, setCamera] = useState<Camera | null>(null);
  const [ratio, setRatio] = useState<string | null>(null);
  const [caption, setCaption] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [cameraHeight, setCameraHeight] = useState(
    Dimensions.get("window").height
  );
  useEffect(() => {
    (async () => {
      const cameraStatus = await requestCameraPermissionsAsync();
      setHasPermission(cameraStatus.status === "granted");
    })();
  }, []);

  useEffect(() => {
    camera?.getSupportedRatiosAsync().then((ratios) => {
      const ratio = ratios[ratios.length - 1];
      setRatio(ratio);
      const x = parseInt(ratio.split(":")[0]);
      const y = parseInt(ratio.split(":")[1]);
      setCameraHeight(Math.floor((Dimensions.get("window").width / y) * x));
    });
  });

  const handleCameraType = () => {
    setCameraType(
      cameraType === CameraType.back ? CameraType.front : CameraType.back
    );
  };

  const takePicture = async () => {
    if (!camera) {
      return;
    }
    const photo = await camera.takePictureAsync();
    await runReplicateForPhoto(photo.uri);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (result.assets && result.assets.length > 0) {
      await runReplicateForPhoto(result.assets[0].uri);
    }
  };

  const runReplicateForPhoto = async (photoUri: string) => {
    const resizedPhoto = await manipulateAsync(
      photoUri,
      [{ resize: { width: 300 } }],
      { format: SaveFormat.PNG, base64: true }
    );
    setPhoto(photoUri);
    setCaption(null);
    setLoading(true);
    const caption = await runModel(
      `data:image/png;base64,${resizedPhoto.base64}`
    );
    setCaption(caption);
    setLoading(false);
  };

  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }
  return (
    <View style={styles.container}>
      {photo && (
        <View style={styles.modal}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => {
              setPhoto(null);
            }}
          >
            <Ionicons name="close-circle" style={styles.modalCloseButtonIcon} />
          </TouchableOpacity>
          <Image style={styles.photoPreview} source={{ uri: photo }} />
          <View style={styles.captionContainer}>
            {loading ? (
              <ActivityIndicator size={"large"} />
            ) : (
              <Text style={styles.captionText}>
                {caption?.replace("Caption: ", "")}
              </Text>
            )}
          </View>
        </View>
      )}
      <Camera
        style={{ flex: 1, maxHeight: cameraHeight }}
        type={cameraType}
        ratio={ratio || undefined}
        ref={(ref) => {
          setCamera(ref);
        }}
      />
      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.button} onPress={() => pickImage()}>
          <Ionicons name="images" style={styles.buttonIcon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => takePicture()}>
          <FontAwesome name="camera" style={styles.buttonIcon} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => handleCameraType()}
        >
          <MaterialCommunityIcons
            name="camera-switch"
            style={styles.buttonIcon}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  modal: {
    position: "absolute",
    flex: 1,
    zIndex: 100,
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "black",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingVertical: 60,
    borderRadius: 30,
  },
  modalCloseButton: { position: "absolute", top: 60, right: 30, zIndex: 101 },
  modalCloseButtonIcon: { color: "#fff", fontSize: 60 },
  photoPreview: {
    flex: 1,
    width: "100%",
    borderRadius: 30,
  },
  captionContainer: { position: "absolute" },
  captionText: {
    fontSize: 30,
    fontWeight: "bold",
    color: "white",
    paddingLeft: 30,
    paddingRight: 30,
    backgroundColor: "black",
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    margin: 30,
  },
  button: {
    alignSelf: "flex-end",
    alignItems: "center",
  },
  buttonIcon: { color: "#fff", fontSize: 40 },
});

export default CameraScreen;
