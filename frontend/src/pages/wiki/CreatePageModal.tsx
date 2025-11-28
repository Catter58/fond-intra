import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { wikiPagesApi } from '../../api/endpoints/wiki';

interface CreatePageModalProps {
  isOpen: boolean;
  onClose: () => void;
  spaceId: number;
  spaceSlug: string;
  parentId?: number;
}

export const CreatePageModal = ({
  isOpen,
  onClose,
  spaceId,
  spaceSlug,
  parentId,
}: CreatePageModalProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    is_published: true,
  });

  const createMutation = useMutation({
    mutationFn: () => wikiPagesApi.create({
      ...formData,
      space: spaceId,
      parent: parentId,
    }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['wiki-space-pages', spaceId] });
      queryClient.invalidateQueries({ queryKey: ['wiki-tree', spaceId] });
      queryClient.invalidateQueries({ queryKey: ['wiki-space', spaceId] });
      handleClose();
      navigate(`/wiki/${spaceSlug}/${data.slug}`);
    },
  });

  const handleClose = () => {
    setFormData({ title: '', excerpt: '', is_published: true });
    createMutation.reset();
    onClose();
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) return;
    createMutation.mutate();
  };

  return (
    <Modal
      open={isOpen}
      onRequestClose={handleClose}
      modalHeading={parentId ? "Создать подстраницу" : "Создать страницу"}
      primaryButtonText="Создать"
      secondaryButtonText="Отмена"
      onRequestSubmit={handleSubmit}
      primaryButtonDisabled={!formData.title.trim() || createMutation.isPending}
    >
      <Form>
        {createMutation.isError && (
          <InlineNotification
            kind="error"
            title="Ошибка"
            subtitle="Не удалось создать страницу"
            lowContrast
            hideCloseButton
          />
        )}

        <FormGroup legendText="">
          <TextInput
            id="page-title"
            labelText="Заголовок"
            placeholder="Название страницы"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </FormGroup>

        <FormGroup legendText="">
          <TextArea
            id="page-excerpt"
            labelText="Краткое описание"
            placeholder="Краткое описание страницы для отображения в списках"
            value={formData.excerpt}
            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
            rows={2}
          />
        </FormGroup>

        <FormGroup legendText="">
          <Toggle
            id="page-published"
            labelText="Опубликовать"
            labelA="Черновик"
            labelB="Опубликовано"
            toggled={formData.is_published}
            onToggle={(checked) => setFormData({ ...formData, is_published: checked })}
          />
        </FormGroup>
      </Form>
    </Modal>
  );
};
