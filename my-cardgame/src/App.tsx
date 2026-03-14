import titleImage from '../resource/title.jpg';
import mainBtnImage from '../resource/mainBtn.png';
import { cards } from './cards';

export default function App() {
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: `url(${titleImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          color: '#ffffff',
          textShadow: '0 4px 12px rgba(0, 0, 0, 0.8)',
        }}
      >
        <h1
          style={{
            fontSize: '4rem',
            marginBottom: '2rem',
            letterSpacing: '0.2em',
          }}
        >
          FinK
        </h1>
        <button
          type="button"
          style={{
            border: 'none',
            padding: 0,
            background: 'none',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              position: 'relative',
              display: 'inline-block',
            }}
          >
            <img
              src={mainBtnImage}
              alt="Game start button"
              style={{
                display: 'block',
                maxWidth: '100%',
                height: 'auto',
              }}
            />
            <span
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: '#ffffff',
                fontSize: '1.5rem',
                fontWeight: 700,
                textShadow: '0 2px 6px rgba(0, 0, 0, 0.9)',
                pointerEvents: 'none',
              }}
            >
              Game start
            </span>
          </div>
        </button>
        <div
          style={{
            marginTop: '3rem',
            padding: '1.5rem 2rem',
            maxHeight: '40vh',
            overflowY: 'auto',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            borderRadius: '12px',
            fontSize: '0.9rem',
          }}
        >
          <h2
            style={{
              marginTop: 0,
              marginBottom: '1rem',
              fontSize: '1.2rem',
            }}
          >
            カード一覧（暫定表示）
          </h2>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              textAlign: 'left',
            }}
          >
            {cards.map((card) => (
              <li
                key={card.no}
                style={{
                  marginBottom: '0.5rem',
                }}
              >
                <strong>
                  No.{card.no} {card.name}
                </strong>{' '}
                ×{card.count}（Type:
                {card.type === 'attack' ? '攻撃' : 'その他'} / 強制発動:
                {card.forcedActivation}） - {card.effectSummary}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}