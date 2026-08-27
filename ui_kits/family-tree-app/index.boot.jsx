
const W = 1280;
const H = 820;

function App() {
  return (
    <DesignCanvas
      title="Into the Unknown — Family Tree App"
      subtitle="Four design directions for the Cason family-tree contribution app. Click expand on any artboard for fullscreen."
    >
      <DCSection
        id="exploration"
        title="Four directions"
        subtitle="All share the same data, components, and visual language. Mix-and-match welcome."
      >
        <DCArtboard id="atlas" label="01 · The Atlas" width={W} height={H}>
          <AtlasView />
        </DCArtboard>
        <DCArtboard id="long-scroll" label="02 · The Long Scroll" width={W} height={H}>
          <LongScrollView />
        </DCArtboard>
        <DCArtboard id="migration" label="03 · The Migration" width={W} height={H}>
          <MigrationView />
        </DCArtboard>
        <DCArtboard id="vault" label="04 · The Vault" width={W} height={H}>
          <VaultView />
        </DCArtboard>
        <DCArtboard id="dashboard" label="05 · The Dashboard" width={W} height={H}>
          <DashboardView />
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
