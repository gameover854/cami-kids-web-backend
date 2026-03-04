const prisma = require("../config/prisma");

class promotionModel {
  static promotionInclude = {
    collections: {
      include: {
        collection: true,
      },
    },
  };

  static async create(data) {
    const { collection_ids, ...promotionData } = data || {};

    return await prisma.promotion.create({
      data: {
        ...promotionData,
        collections: Array.isArray(collection_ids)
          ? {
              create: collection_ids.map((collectionId) => ({
                collection: {
                  connect: { id: collectionId },
                },
              })),
            }
          : undefined,
      },
      include: this.promotionInclude,
    });
  }

  static async findAll() {
    return await prisma.promotion.findMany({
      include: this.promotionInclude,
    });
  }

  static async findById(id) {
    return await prisma.promotion.findUnique({
      where: { id },
      include: this.promotionInclude,
    });
  }

  static async update(id, data) {
    const { collection_ids, ...promotionData } = data || {};
    const updateData = { ...promotionData };

    if (Array.isArray(collection_ids)) {
      updateData.collections = {
        deleteMany: {},
        create: collection_ids.map((collectionId) => ({
          collection: {
            connect: { id: collectionId },
          },
        })),
      };
    }

    return await prisma.promotion.update({
      where: { id },
      data: updateData,
      include: this.promotionInclude,
    });
  }

  static async delete(id) {
    return await prisma.promotion.delete({ where: { id } });
  }
}

module.exports = promotionModel;
