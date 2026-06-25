import idle from "../assets/hami/idle.gif";
import thinking from "../assets/hami/thinking.gif";
import working from "../assets/hami/working.gif";
import happy from "../assets/hami/happy.gif";
import warning from "../assets/hami/warning.gif";

interface Props {
  mood: string;
}

function HamiAvatar({ mood }: Props) {
  let gif = idle;

  switch (mood) {
    case "thinking":
      gif = thinking;
      break;

    case "working":
      gif = working;
      break;

    case "happy":
      gif = happy;
      break;

    case "warning":
      gif = warning;
      break;

    default:
      gif = idle;
  }

  return (
    <div
      style={{
        textAlign: "center",
        marginBottom: "15px",
      }}
    >
      <img
        src={gif}
        alt="Hami"
        style={{
          width: "220px",
        }}
      />
    </div>
  );
}

export default HamiAvatar;