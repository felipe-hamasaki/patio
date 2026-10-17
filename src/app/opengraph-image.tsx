import { ImageResponse } from 'next/og';

export const alt = 'Pátio. Cada serviço, no seu ritmo. Demonstração de gestão de oficinas.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '72px',
        background: '#f5f7f2',
        color: '#183329',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '80px',
            height: '80px',
            borderRadius: '22px',
            background: '#15803d',
            color: 'white',
            fontSize: '62px',
            fontWeight: 700,
          }}
        >
          p
        </div>
        <span style={{ fontSize: '62px', fontWeight: 700 }}>pátio.</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <span style={{ fontSize: '70px', fontWeight: 700, letterSpacing: '-3px' }}>
          Cada serviço, no seu ritmo.
        </span>
        <span style={{ fontSize: '28px', color: '#52665b' }}>
          Da entrada à entrega. Uma oficina inteira para explorar.
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          borderTop: '1px solid #bccabc',
          paddingTop: '26px',
          fontSize: '23px',
        }}
      >
        <span>Demonstração interativa de portfólio</span>
        <span>Sem cadastro · Dados fictícios</span>
      </div>
    </div>,
    size,
  );
}
