// Tarjeta estilo iOS: fondo elevado, esquinas redondeadas, sin bordes duros.
export default function Card({ children, className = '', hover = true, flat = false }) {
  if (flat) {
    return (
      <div className={`bg-ios-elev2 rounded-ios ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <div
      className={`bg-ios-elev rounded-ios-lg
        ${hover ? 'hover:bg-ios-elev2 transition-colors duration-200' : ''}
        ${className}`}
    >
      {children}
    </div>
  );
}
