function RecordCrateFallback({ hidden = false, failed = false }) {
  return (
    <div
      className={`record-fallback${hidden ? ' is-hidden' : ''}`}
      aria-hidden={failed ? undefined : 'true'}
      role={failed ? 'status' : undefined}
    >
      {failed ? (
        <p className="record-fallback-error">record crate unavailable</p>
      ) : (
        <div className="record-loading-mark" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      )}
    </div>
  );
}

export default RecordCrateFallback;
