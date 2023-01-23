import CameraScreen from "./app/CameraScreen";
import { init } from "@sapi/react-native-sdk";


init({
  sapiId: 'api-replicate-com-i24sjl', //todo: replace with your own Sapi id
  platform: "React Native",
});

export default function App() {
  return <CameraScreen />;
}
