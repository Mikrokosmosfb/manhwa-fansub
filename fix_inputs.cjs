const fs = require('fs');

function addOnBlur(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  const props = ['top', 'right', 'bottom', 'left', 'width'];
  let changes = 0;
  
  props.forEach(prop => {
    ['decorations', 'profileDecorations'].forEach(type => {
      const search = `onChange={e => { const u = [...editingThemeStyle.${type}!]; u[idx].${prop} = e.target.value; setEditingThemeStyle({ ...editingThemeStyle, ${type}: u }); }}`;
      const replace = `${search} onBlur={e => { let v = e.target.value.trim(); if(v && !isNaN(Number(v))) { const u = [...editingThemeStyle.${type}!]; u[idx].${prop} = v + 'px'; setEditingThemeStyle({ ...editingThemeStyle, ${type}: u }); } }}`;
      
      if(content.includes(search)) {
        content = content.split(search).join(replace);
        changes++;
      }
    });
  });
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Changes made:', changes);
}

addOnBlur('src/components/AdminModal.tsx');
