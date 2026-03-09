const PREFIX = 'taskhive_task_attachment_v1';

const buildKey = (taskId) => `${PREFIX}:${taskId}`;

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

export const saveTaskAttachment = async (taskId, file) => {
  if (!taskId || !file) throw new Error('Missing task or file');

  const key = buildKey(taskId);
  const dataUrl = await readFileAsDataUrl(file);

  try {
    localStorage.setItem(
      key,
      JSON.stringify({
        dataUrl,
        name: file.name,
        mime: file.type,
        size: file.size,
        createdAt: Date.now(),
      }),
    );
  } catch {
    throw new Error('Local storage is full. Please try a smaller file or clear site data.');
  }

  return key;
};

export const getTaskAttachment = (taskIdOrKey) => {
  if (!taskIdOrKey) return null;
  const key = taskIdOrKey.startsWith(PREFIX) ? taskIdOrKey : buildKey(taskIdOrKey);

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

