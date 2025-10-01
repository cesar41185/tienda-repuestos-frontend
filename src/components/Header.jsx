// En src/components/Header.jsx
import React from 'react';

function Header() {
  return (
    <header className="app-header">
      <img src="/logo.png" alt="Logo de la tienda" className="logo" />
      <h1>Verificador de Válvulas</h1>
    </header>
  );
}

export default Header;