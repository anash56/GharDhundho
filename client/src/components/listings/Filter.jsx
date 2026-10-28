function Filter({ label, name, value, change, opts }) {
  return (
    <div className="filter-block" role="group" aria-label={label}>
      <b>{label}</b>
      <label className="check">
        <input
          type="radio"
          name={name}
          checked={!value}
          onChange={() => change(name, "")}
        />
        <span>Any</span>
      </label>
      {opts.map((option) => (
        <label className="check" key={option}>
          <input
            type="radio"
            name={name}
            checked={value === option}
            onChange={() => change(name, option)}
          />
          <span>{option === "semi" ? "Semi-furnished" : option[0].toUpperCase() + option.slice(1)}</span>
        </label>
      ))}
    </div>
  );
}

export default Filter;
