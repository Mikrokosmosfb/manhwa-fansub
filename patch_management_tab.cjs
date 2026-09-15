const fs = require('fs');
let code = fs.readFileSync('src/components/ManagementPanel.tsx', 'utf8');

const target = `const [activeNav, setActiveNav] = useState<ManagementNavTab>('manage-series');`;

const replacement = `const [activeNav, setActiveNav] = useState<ManagementNavTab>(() => {
    const saved = localStorage.getItem('management_active_nav');
    return (saved as ManagementNavTab) || 'manage-series';
  });

  React.useEffect(() => {
    localStorage.setItem('management_active_nav', activeNav);
  }, [activeNav]);`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/components/ManagementPanel.tsx', code);
  console.log("Patched ManagementPanel.tsx to persist tab.");
} else {
  console.log("Target not found.");
}
