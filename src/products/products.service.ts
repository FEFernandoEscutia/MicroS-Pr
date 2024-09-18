import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaClient } from '@prisma/client';
import { PaginationDto } from 'src/common';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('Products Service');
  onModuleInit() {
    this.$connect();
    this.logger.log('Database Connected');
  }

  create(createProductDto: CreateProductDto) {
    return this.product.create({
      data: createProductDto,
    });
  }

  async findAll(paginationDto: PaginationDto) {
    const { page, limit } = paginationDto;
    const totalPages = await this.product.count({});
    const lastPage = Math.ceil(totalPages / limit);

    if (page > lastPage) {
      throw new BadRequestException(
        `page not found, last page should be #${lastPage}`,
      );
    }

    return {
      data: await this.product.findMany({
        skip: (page - 1) * limit,
        take: limit,
      }),
      metaData: {
        page: page,
        total: totalPages,
        lastPage: lastPage,
      },
    };
  }

  async findOne(id: string) {
    const productDb = await this.product.findUnique({
      where: {
        id,
      },
    });
    if (!productDb) {
      throw new NotFoundException('The product does not exist');
    }
    return productDb;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const dbProduct = await this.findOne(id);
    if (!dbProduct) {
      throw new NotFoundException('The product does not exist');
    }
    return await this.product.update({
      where: {
        id: dbProduct.id,
      },
      data: updateProductDto,
    });
  }

  // soft delete
  async remove(id: string) {
    const dbProduct = await this.findOne(id);
    if (dbProduct.isAvailable === false) {
      throw new ConflictException('The Product is already unavailable ');
    }
    return await this.product.update({
      where: {
        id: (await dbProduct).id,
      },
      data: {
        isAvailable: false,
      },
    });
  }

  //Hard Remove
  // async remove(id: string) {
  //   const dbProduct = await this.findOne(id);
  //   if (!dbProduct) {
  //     throw new NotFoundException('The product does not exist');
  //   }
  //   return {
  //     message: `The product with the id ${id} has been deleted successfully`,
  //     product: await this.product.delete({
  //       where: {
  //         id,
  //       },
  //     }),
  //   };
  // }
}
