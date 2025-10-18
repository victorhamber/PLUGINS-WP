# Design Document

## Overview

O problema identificado é que o dialog de plugins fecha automaticamente durante uploads devido a eventos não controlados do input file e possível re-renderização de componentes. A solução envolve melhorar o controle de estado do dialog, implementar bloqueios durante uploads e otimizar o feedback visual para o usuário.

## Architecture

### Current State Analysis
- O componente `AdminPlugins.tsx` já possui lógica básica para prevenir fechamento durante uploads
- A função `handleDialogClose` tem proteção, mas pode não estar sendo aplicada consistentemente
- Os inputs de arquivo podem estar disparando eventos que causam re-renderização indesejada

### Proposed Changes
1. **Enhanced Dialog State Management**: Melhorar o controle de estado do dialog com flags específicas para uploads
2. **Event Handling Optimization**: Implementar handlers mais robustos para eventos de arquivo
3. **UI Feedback Enhancement**: Adicionar indicadores visuais mais claros durante uploads
4. **Form State Preservation**: Garantir que o estado do formulário seja mantido durante todo o processo

## Components and Interfaces

### Enhanced State Management

```typescript
interface UploadState {
  isUploadingFile: boolean;
  isUploadingImage: boolean;
  uploadProgress?: {
    type: 'file' | 'image';
    filename: string;
  };
}

interface DialogState {
  isOpen: boolean;
  canClose: boolean;
  preventAutoClose: boolean;
}
```

### Modified Component Structure

```typescript
// Enhanced state hooks
const [dialogState, setDialogState] = useState<DialogState>({
  isOpen: false,
  canClose: true,
  preventAutoClose: false
});

const [uploadState, setUploadState] = useState<UploadState>({
  isUploadingFile: false,
  isUploadingImage: false
});
```

### File Upload Handlers

```typescript
// Enhanced file upload with better state management
const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  // Prevent dialog from closing during upload
  setDialogState(prev => ({ ...prev, canClose: false, preventAutoClose: true }));
  setUploadState(prev => ({ ...prev, isUploadingFile: true }));
  
  try {
    // Upload logic with progress tracking
    // ...
  } finally {
    // Re-enable dialog closing after upload
    setDialogState(prev => ({ ...prev, canClose: true, preventAutoClose: false }));
    setUploadState(prev => ({ ...prev, isUploadingFile: false }));
    
    // Clear input value to prevent issues
    e.target.value = '';
  }
};
```

### Dialog Control Enhancement

```typescript
// Enhanced dialog close handler
const handleDialogClose = (open: boolean) => {
  // Multiple layers of protection
  if (!open && dialogState.preventAutoClose) {
    return;
  }
  
  if (!open && (uploadState.isUploadingFile || uploadState.isUploadingImage)) {
    return;
  }
  
  if (!open && !dialogState.canClose) {
    return;
  }
  
  setDialogState(prev => ({ ...prev, isOpen: open }));
  if (!open) {
    resetForm();
  }
};
```

## Data Models

### Upload Progress Tracking

```typescript
interface UploadProgress {
  type: 'file' | 'image';
  filename: string;
  status: 'uploading' | 'success' | 'error';
  message?: string;
}
```

### Enhanced Form State

```typescript
interface FormState extends PluginFormData {
  uploadStatus: {
    file?: UploadProgress;
    image?: UploadProgress;
  };
}
```

## Error Handling

### Upload Error Recovery
- Manter dialog aberto em caso de erro de upload
- Preservar todos os dados do formulário
- Exibir mensagens de erro específicas
- Permitir retry do upload sem perder dados

### Dialog State Recovery
- Implementar fallback para casos onde o estado fica inconsistente
- Adicionar logs para debug de problemas de estado
- Garantir que o dialog sempre possa ser fechado manualmente quando apropriado

## Testing Strategy

### Unit Tests
- Testar handlers de upload com diferentes cenários
- Verificar comportamento do dialog durante uploads
- Validar preservação do estado do formulário

### Integration Tests
- Testar fluxo completo de criação de plugin com uploads
- Verificar comportamento em casos de erro
- Testar interação entre múltiplos uploads

### User Acceptance Tests
- Validar que o dialog não fecha durante uploads
- Confirmar feedback visual adequado
- Testar cenários de erro e recuperação

## Implementation Notes

### Key Changes Required

1. **State Management**:
   - Separar estado de upload do estado geral do componente
   - Implementar flags específicas para controle de fechamento
   - Adicionar tracking de progresso de upload

2. **Event Handling**:
   - Melhorar handlers de arquivo para evitar side effects
   - Implementar debouncing se necessário
   - Garantir limpeza adequada de event listeners

3. **UI Enhancements**:
   - Adicionar indicadores visuais de upload em progresso
   - Desabilitar botões apropriados durante uploads
   - Melhorar mensagens de feedback

4. **Error Boundaries**:
   - Implementar tratamento robusto de erros de upload
   - Garantir que erros não causem fechamento do dialog
   - Adicionar logs para debugging

### Performance Considerations
- Evitar re-renderizações desnecessárias durante uploads
- Otimizar atualizações de estado para minimizar impacto na UI
- Implementar cleanup adequado de recursos

### Browser Compatibility
- Testar comportamento em diferentes navegadores
- Garantir que file inputs funcionem consistentemente
- Verificar compatibilidade com diferentes versões do React