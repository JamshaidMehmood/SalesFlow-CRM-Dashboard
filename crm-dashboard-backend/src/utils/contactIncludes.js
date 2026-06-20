export const contactListInclude = {
  owner: { select: { id: true, name: true } },
  leadSource: { select: { id: true, name: true } },
  tags: { include: { tag: true } },
  customValues: {
    include: { fieldDefinition: true },
  },
  deals: {
    select: {
      id: true,
      value: true,
      stageId: true,
      lostReason: true,
      lostReasonNote: true,
      stage: { select: { id: true, name: true, isWonStage: true, isLostStage: true } },
    },
  },
  _count: { select: { activities: true, notes: true } },
};

export const contactDetailInclude = {
  owner: { select: { id: true, name: true, email: true } },
  leadSource: { select: { id: true, name: true } },
  tags: { include: { tag: true } },
  customValues: {
    include: { fieldDefinition: true },
  },
  attachments: {
    orderBy: { uploadedAt: 'desc' },
    include: { uploader: { select: { id: true, name: true } } },
  },
  deals: {
    orderBy: { createdAt: 'desc' },
    include: {
      stage: true,
      attachments: {
        include: { uploader: { select: { id: true, name: true } } },
      },
    },
  },
  tasks: {
    where: { status: 'pending' },
    orderBy: { dueDate: 'asc' },
  },
  notes: {
    orderBy: { createdAt: 'desc' },
    include: { author: { select: { id: true, name: true } } },
  },
  activities: {
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { id: true, name: true } } },
  },
};

export function serializeContact(contact) {
  if (!contact) return contact;
  return {
    ...contact,
    tags: contact.tags?.map((ct) => ct.tag) || [],
    customFields: contact.customValues?.reduce((acc, cv) => {
      if (cv.fieldDefinition && !cv.fieldDefinition.deletedAt) {
        acc[cv.fieldDefinitionId] = cv.value;
      }
      return acc;
    }, {}),
  };
}
