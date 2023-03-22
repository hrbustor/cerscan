import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MetaModel } from '../entities/model/model.entity';
import { MetaModelRepository } from '../entities/model/model.repository';
import { In } from 'typeorm';

@Injectable()
export default class ModelService {
  private readonly logger = new Logger(ModelService.name);

  constructor(
    @InjectRepository(MetaModel)
    private readonly metaModelRepository: MetaModelRepository,
  ) { }

  async findModelsByIds(streamIds: string[]): Promise<MetaModel[]> {
    return this.metaModelRepository.find({
      where: { stream_id: In(streamIds) },
    });
  }

  async findAllModelIds(): Promise<string[]> {
    const result = await this.metaModelRepository
      .createQueryBuilder()
      .select(['stream_id'])
      .getRawMany();
    return result.map((r) => r['stream_id']);
  }

  async findModels(
    pageSize: number,
    pageNumber: number,
    name?: string,
    did?: string,
    description?: string,
    startTimeMs?: number,
  ): Promise<MetaModel[]> {
    let whereSql = '';
    if (name?.trim().length > 0) {
      if (whereSql.length > 0) {
        whereSql += ' AND ';
      }
      whereSql += `LOWER(stream_content->>'name') LIKE :nameValue`;
    }
    if (did?.trim().length > 0) {
      if (whereSql.length > 0) {
        whereSql += ' AND ';
      }
      whereSql += `controller_did=:did`;
    }
    if (description?.trim().length > 0) {
      if (whereSql.length > 0) {
        whereSql += ' AND ';
      }
      whereSql += `LOWER(stream_content->>'description') LIKE :descriptionValue`;
    }

    if (startTimeMs > 0) {
      if (whereSql.length > 0) {
        whereSql += ' AND ';
      }
      whereSql += 'created_at > :startTime';
    }

    return await this.metaModelRepository
      .createQueryBuilder()
      .where(whereSql, {
        nameValue: '%' + name?.toLowerCase() + '%',
        descriptionValue: '%' + description?.toLowerCase() + '%',
        startTime: new Date(Number(startTimeMs)),
        did: did,
      })
      .limit(pageSize)
      .offset(pageSize * (pageNumber - 1))
      .orderBy('created_at', 'DESC')
      .getMany();
  }
}
