import { useRef } from 'react';
import styles from './Header.module.css';

interface HeaderProps {
  onImport: (file: File) => Promise<void>;
  importError: string | null;
}

export default function Header({ onImport, importError }: HeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onImport(file);
    e.target.value = '';
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <span>Semedit</span>
        <span className={styles.importArea}>
          <button className={styles.importLink} onClick={() => fileInputRef.current?.click()}>
            Import
          </button>
          {importError && <span className={styles.importError}>{importError}</span>}
          <input
            ref={fileInputRef}
            type="file"
            accept=".ttl"
            style={{ display: 'none' }}
            onChange={handleChange}
          />
        </span>
      </div>
    </header>
  );
}
