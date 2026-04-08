const fs = require('fs');
let code = fs.readFileSync('src/pages/dashboard/NovoPedido.tsx', 'utf8');

// 1. Remove `cor: string;` in FormData and PedidoItemForm
code = code.replace(/  cor: string;\r?\n/g, '');

// 2. Remove `cor: '',` in default states
code = code.replace(/  cor: '',\r?\n/g, '');

// 3. Remove `cor: pedido.cor || '',`
code = code.replace(/          cor: pedido.cor \|\| '',\r?\n/g, '');

// 4. Remove `cor: it.cor || '',`
code = code.replace(/                cor: it.cor \|\| '',\r?\n/g, '');

// 5. Remove `if (pedido.cor) { setCoresDisponiveis(...) }`
code = code.replace(/        if \(pedido\.cor\) \{\r?\n          setCoresDisponiveis\(prev => prev\.includes\(pedido\.cor\) \? prev : \[\.\.\.prev, pedido\.cor\]\);\r?\n        \}\r?\n/g, '');

// 6. Remove coresDisponiveis logic from useEffect
code = code.replace(/    if \(cor && !coresDisponiveis\.includes\(cor\)\) \{\r?\n      setCoresDisponiveis\(prev => \[\.\.\.prev, cor\]\);\r?\n    \}\r?\n/g, '');

// 7. Remove `const [coresDisponiveis...` and `novaCor`
code = code.replace(/  const \[coresDisponiveis.*?\]\);\r?\n/s, '');
code = code.replace(/  const \[novaCor, setNovaCor\] = useState\(''\);\r?\n/, '');
code = code.replace(/  const \[modalNovaCorAberto, setModalNovaCorAberto\] = useState\(false\);\r?\n/, '');
code = code.replace(/  const \[corParaExcluir, setCorParaExcluir\] = useState<string \| null>\(null\);\r?\n/, '');

// 8. Remove `adicionarNovaCor` and `excluirCor` functions
const regexCorFuncs = /  const adicionarNovaCor = async \(\) => \{.+?  \};\r?\n\r?\n  const excluirCor = async \(corParaRemover: string\) => \{.+?  \};\r?\n/s;
code = code.replace(regexCorFuncs, '');

// 9. Remove `!formData.cor` validations
code = code.replace(/\|\| !formData\.cor /g, '');
code = code.replace(/ e cor /g, ' ');

// 10. Remove `<div className="space-y-2">\s*<Label htmlFor="cor">Cor<\/Label>...` UI block
const regexCorUI = /                  <div className="space-y-2">\r?\n                    <Label htmlFor="cor">Cor<\/Label>.+?<\/Dialog>\r?\n                    <\/div>\r?\n                  <\/div>\r?\n/s;
code = code.replace(regexCorUI, '');

// 11. Remove from destructuring
code = code.replace(/, cor/g, '');
code = code.replace(/const cores = categorias\.filter\(cat => cat\.tipo === 'cor'\)\.map\(cat => cat\.nome\);\r?\n/g, '');
code = code.replace(/          if \(cores\.length > 0\) setCoresDisponiveis\(cores\);\r?\n/g, '');
code = code.replace(/coresDisponiveis, /g, '');

// 12. Fix handleAvancarWizard validation
// It's checked during step 2 validations, let's remove any mention of 'Cor'
// wait, we didn't add it yet, we just wanted to add that step 2 validation!
// In handleAvancarWizard, there's no step 2 validation right now. We will add it after this script.

fs.writeFileSync('src/pages/dashboard/NovoPedido.tsx', code);
console.log('Done replacing cor');
