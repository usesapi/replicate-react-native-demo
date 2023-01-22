import CameraScreen from "./app/CameraScreen";
import { SAPI_ID } from "@env";
import { init } from "./sapi-rn-sdk";

init({
  sapiId: SAPI_ID,
  platform: "React Native",
});

export default function App() {
  return <CameraScreen />;
}