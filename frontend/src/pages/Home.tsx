import ChatBox from "../components/ChatBox";

// Import your Hami GIFs here:
// import idleGif from "../assets/hami/idle.gif";
// Then pass the right one as hamiGif={idleGif} to ChatBox

function Home() {
  return (
    <>
      <h1>🐹 Hami AI</h1>
      <p className="subtitle">Your cute personal schedule assistant</p>
      <ChatBox
        // hamiGif={idleGif}   ← uncomment once you import the GIF
      />
    </>
  );
}

export default Home;