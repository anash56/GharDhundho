function Step({ n, title, text }) {
  return (
    <article className="step">
      <span>{n}</span>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

export default Step;
