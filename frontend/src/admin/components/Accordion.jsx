import { useState } from 'react';

export default function Accordion({ title, opened = false, children }) {
  const [isOpen, setIsOpen] = useState(opened);

  return (
    <section className="conf-step">
      <header
        className={`conf-step__header ${isOpen ? 'conf-step__header_opened' : 'conf-step__header_closed'}`}
        onClick={() => setIsOpen((v) => !v)}
      >
        <h2 className="conf-step__title">{title}</h2>
      </header>
      {isOpen && <div className="conf-step__wrapper">{children}</div>}
    </section>
  );
}