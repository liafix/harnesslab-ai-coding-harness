import { releaseInfo } from "../presentation/release-info";

export function ReleaseStrip() {
  return (
    <aside className="release-strip" aria-label="Release candidate information">
      <div><span className="release-dot" aria-hidden="true" /><strong>{releaseInfo.label}</strong><small>{releaseInfo.version}</small></div>
      <div><span>Mode</span><strong>{releaseInfo.mode}</strong></div>
      <div><span>Runtime</span><strong>{releaseInfo.providerRequirement}</strong></div>
      <div><span>Visibility</span><strong>{releaseInfo.visibility}</strong></div>
    </aside>
  );
}
