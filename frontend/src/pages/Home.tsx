import ChatBox from "../components/ChatBox";

function Home() {
  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "40px auto",
      }}
    >
      <h1>🐹 Hami AI</h1>

      <ChatBox />
    </div>
  );
}

export default Home;