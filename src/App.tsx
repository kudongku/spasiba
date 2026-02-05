import ThreeCanvas from '@/components/ThreeCanvas';
import TennisBallButton from '@/components/ui/TennisBallButton';

function App() {
  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <ThreeCanvas />
      <TennisBallButton />
    </div>
  );
}

export default App;
