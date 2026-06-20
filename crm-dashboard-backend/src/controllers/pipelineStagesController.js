import prisma from '../utils/prisma.js';

export async function getPipelineStages(_req, res) {
  try {
    const stages = await prisma.pipelineStage.findMany({
      orderBy: { orderIndex: 'asc' },
      include: { _count: { select: { deals: true } } },
    });
    res.json(stages);
  } catch (err) {
    console.error('Get pipeline stages error:', err);
    res.status(500).json({ error: 'Failed to fetch pipeline stages' });
  }
}

export async function createPipelineStage(req, res) {
  try {
    const { name, isWonStage, isLostStage, winProbability } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const maxOrder = await prisma.pipelineStage.aggregate({ _max: { orderIndex: true } });
    const orderIndex = (maxOrder._max.orderIndex ?? -1) + 1;

    const stage = await prisma.pipelineStage.create({
      data: {
        name,
        orderIndex,
        isWonStage: !!isWonStage,
        isLostStage: !!isLostStage,
        winProbability: winProbability ?? (isWonStage ? 100 : isLostStage ? 0 : 10),
      },
      include: { _count: { select: { deals: true } } },
    });

    res.status(201).json(stage);
  } catch (err) {
    console.error('Create pipeline stage error:', err);
    res.status(500).json({ error: 'Failed to create pipeline stage' });
  }
}

export async function updatePipelineStage(req, res) {
  try {
    const { id } = req.params;
    const { name, isWonStage, isLostStage, winProbability } = req.body;

    const stage = await prisma.pipelineStage.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(isWonStage !== undefined && { isWonStage }),
        ...(isLostStage !== undefined && { isLostStage }),
        ...(winProbability !== undefined && { winProbability: Number(winProbability) }),
      },
      include: { _count: { select: { deals: true } } },
    });

    res.json(stage);
  } catch (err) {
    console.error('Update pipeline stage error:', err);
    res.status(500).json({ error: 'Failed to update pipeline stage' });
  }
}

export async function reorderPipelineStages(req, res) {
  try {
    const { stageIds } = req.body;

    if (!Array.isArray(stageIds)) {
      return res.status(400).json({ error: 'stageIds array is required' });
    }

    await prisma.$transaction(
      stageIds.map((id, index) =>
        prisma.pipelineStage.update({
          where: { id },
          data: { orderIndex: index },
        })
      )
    );

    const stages = await prisma.pipelineStage.findMany({
      orderBy: { orderIndex: 'asc' },
      include: { _count: { select: { deals: true } } },
    });

    res.json(stages);
  } catch (err) {
    console.error('Reorder pipeline stages error:', err);
    res.status(500).json({ error: 'Failed to reorder pipeline stages' });
  }
}

export async function deletePipelineStage(req, res) {
  try {
    const { id } = req.params;
    const { reassignToStageId } = req.body;

    const stage = await prisma.pipelineStage.findUnique({
      where: { id },
      include: { _count: { select: { deals: true } } },
    });

    if (!stage) {
      return res.status(404).json({ error: 'Stage not found' });
    }

    if (stage._count.deals > 0) {
      if (!reassignToStageId) {
        return res.status(400).json({
          error: `Stage has ${stage._count.deals} deal(s). Provide reassignToStageId to move them first.`,
          dealCount: stage._count.deals,
        });
      }

      await prisma.deal.updateMany({
        where: { stageId: id },
        data: { stageId: reassignToStageId },
      });
    }

    await prisma.pipelineStage.delete({ where: { id } });
    res.json({ message: 'Stage deleted' });
  } catch (err) {
    console.error('Delete pipeline stage error:', err);
    res.status(500).json({ error: 'Failed to delete pipeline stage' });
  }
}
