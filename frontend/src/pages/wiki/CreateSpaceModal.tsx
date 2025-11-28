import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Modal,
  TextInput,
  TextArea,
  Toggle,
  Form,
  FormGroup,
  InlineNotification,
} from '@carbon/react';
import { wikiSpacesApi } from '../../api/endpoints/wiki';

interface CreateSpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateSpaceModal = ({ isOpen, onClose }: CreateSpaceModalProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    is_public: true,
  });

  const createMutation = useMutation({
    mutationFn: wikiSpacesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wiki-spaces'] });
      handleClose();
    },
  });

  const handleClose = () => {
    setFormData({ name: '', description: '', icon: '', is_public: true });
    createMutation.reset();
    onClose();
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) return;
    createMutation.mutate(formData);
  };

  return (
    <Modal
      open={isOpen}
      onRequestClose={handleClose}
      modalHeading="Создать пространство"
      primaryButtonText="Создать"
      secondaryButtonText="Отмена"
      onRequestSubmit={handleSubmit}
      primaryButtonDisabled={!formData.name.trim() || createMutation.isPending}
    >
      <Form>
        {createMutation.isError && (
          <InlineNotification
            kind="error"
            title="Ошибка"
            subtitle="Не удалось создать пространство"
            lowContrast
            hideCloseButton
          />
        )}

        <FormGroup legendText="">
          <TextInput
            id="space-name"
            labelText="Название"
            placeholder="Название пространства"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </FormGroup>

        <FormGroup legendText="">
          <TextArea
            id="space-description"
            labelText="Описание"
            placeholder="Краткое описание пространства"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />
        </FormGroup>

        <FormGroup legendText="">
          <TextInput
            id="space-icon"
            labelText="Иконка (эмодзи)"
            placeholder="📚"
            value={formData.icon}
            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
            maxLength={4}
          />
        </FormGroup>

        <FormGroup legendText="">
          <Toggle
            id="space-public"
            labelText="Публичное пространство"
            labelA="Приватное"
            labelB="Публичное"
            toggled={formData.is_public}
            onToggle={(checked) => setFormData({ ...formData, is_public: checked })}
          />
        </FormGroup>
      </Form>
    </Modal>
  );
};
