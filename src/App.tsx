import { useState } from 'react';
import Header from './app-components/Header';
import Navigation from './app-components/Navigation';
import MainBody from './app-components/MainBody';
import Footer from './app-components/Footer';
import { useTreeData } from './hooks/useTreeData';
import { logger } from './lib/logger';
import styles from './App.module.css';
import type { TreeItem } from './types/tree';

export default function App() {
  const { data, loading, error, removeNode, addNode, renameNode, moveNode, loadTree } =
    useTreeData('/api/tree');
  const [importError, setImportError] = useState<string | null>(null);

  const handleImport = async (file: File) => {
    const form = new FormData();
    form.append('file', file);

    let uploadResult: { ok: boolean; graphLabel?: string; tripleCount?: number; nodeCount?: number; error?: string };
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      uploadResult = await res.json();
    } catch (e) {
      const msg = (e as Error).message;
      logger.error('[import] network error:', msg);
      setImportError(msg);
      return;
    }

    if (!uploadResult.ok) {
      logger.error('[import] server rejected:', uploadResult.error);
      setImportError(uploadResult.error ?? 'Upload failed');
      return;
    }

    logger.info(
      '[import]',
      file.name,
      `triples:${uploadResult.tripleCount}`,
      `nodes:${uploadResult.nodeCount}`,
      `graph:${uploadResult.graphLabel}`
    );

    try {
      const treeRes = await fetch('/api/tree');
      const tree = await treeRes.json() as TreeItem[];
      loadTree(tree);
      setImportError(null);
    } catch (e) {
      const msg = (e as Error).message;
      logger.error('[import] tree reload failed:', msg);
      setImportError(msg);
    }
  };

  return (
    <div className={styles.app}>
      <Header onImport={handleImport} importError={importError} />
      <div className={styles.content}>
        <Navigation
          data={data}
          loading={loading}
          error={error}
          removeNode={removeNode}
          addNode={addNode}
          renameNode={renameNode}
          moveNode={moveNode}
        />
        <MainBody />
      </div>
      <Footer />
    </div>
  );
}
