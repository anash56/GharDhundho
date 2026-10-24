function Filter({ label, name, value, change, opts }) {
  return (
    <div className="filter-block">
      <b>{label}</b>
      {opts.map((o) => (
        <label className="check" key={o}>
          <input
            type="radio"
            name={name}
            checked={value === o}
            onChange={() => change(name, value === o ? "" : o)}
          />
          <span>{o === "semi" ? "Semi-furnished" : o[0].toUpperCase() + o.slice(1)}</span>
        </label>
      ))}
    </div>
  );
}

export default Filter;
