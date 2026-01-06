import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice, InvoiceStatus } from '../database/entities/invoice.entity';
import { Payout, PayoutStatus } from '../database/entities/payout.entity';
import { Load } from '../database/entities/load.entity';
import { Carrier } from '../database/entities/carrier.entity';
import {
  CreateInvoiceDto,
  CreatePayoutDto,
  InvoiceResponseDto,
  PayoutResponseDto,
  PaymentSummaryDto,
} from './dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(Payout)
    private readonly payoutRepository: Repository<Payout>,
    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
    @InjectRepository(Carrier)
    private readonly carrierRepository: Repository<Carrier>,
  ) {}

  async createInvoice(dto: CreateInvoiceDto): Promise<InvoiceResponseDto> {
    const load = await this.loadRepository.findOne({ where: { id: dto.loadId } });
    if (!load) {
      throw new NotFoundException('Load not found');
    }

    const carrier = await this.carrierRepository.findOne({ where: { id: dto.carrierId } });
    if (!carrier) {
      throw new NotFoundException('Carrier not found');
    }

    const invoice = this.invoiceRepository.create({
      loadId: dto.loadId,
      carrierId: dto.carrierId,
      amountUsd: dto.amountUsd,
      dueDate: new Date(dto.dueDate),
      status: 'pending',
    });

    await this.invoiceRepository.save(invoice);
    return this.mapInvoiceToResponse(invoice, carrier);
  }

  async findAllInvoices(filters: { page: number; limit: number; carrierId?: string; status?: string }) {
    const where: any = {};
    if (filters.carrierId) where.carrierId = filters.carrierId;
    if (filters.status) where.status = filters.status;

    const [data, total] = await this.invoiceRepository.findAndCount({
      where,
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      order: { createdAt: 'DESC' },
      relations: ['carrier', 'load'],
    });

    return {
      data: data.map(i => this.mapInvoiceToResponse(i, i.carrier)),
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    };
  }

  async findInvoice(id: string): Promise<InvoiceResponseDto> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id },
      relations: ['carrier', 'load'],
    });
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }
    return this.mapInvoiceToResponse(invoice, invoice.carrier);
  }

  async markInvoicePaid(id: string): Promise<InvoiceResponseDto> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id },
      relations: ['carrier'],
    });
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status === 'paid') {
      throw new BadRequestException('Invoice is already paid');
    }

    invoice.status = 'paid';
    invoice.paidAt = new Date();
    await this.invoiceRepository.save(invoice);
    return this.mapInvoiceToResponse(invoice, invoice.carrier);
  }

  async createPayout(dto: CreatePayoutDto): Promise<PayoutResponseDto> {
    const carrier = await this.carrierRepository.findOne({ where: { id: dto.carrierId } });
    if (!carrier) {
      throw new NotFoundException('Carrier not found');
    }

    if (dto.invoiceId) {
      const invoice = await this.invoiceRepository.findOne({ where: { id: dto.invoiceId } });
      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }
    }

    const payout = this.payoutRepository.create({
      carrierId: dto.carrierId,
      invoiceId: dto.invoiceId,
      amountUsd: dto.amountUsd,
      method: dto.method,
      status: 'pending',
    });

    await this.payoutRepository.save(payout);
    return this.mapPayoutToResponse(payout, carrier);
  }

  async findAllPayouts(filters: { page: number; limit: number; carrierId?: string; status?: string }) {
    const where: any = {};
    if (filters.carrierId) where.carrierId = filters.carrierId;
    if (filters.status) where.status = filters.status;

    const [data, total] = await this.payoutRepository.findAndCount({
      where,
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      order: { createdAt: 'DESC' },
      relations: ['carrier'],
    });

    return {
      data: data.map(p => this.mapPayoutToResponse(p, p.carrier)),
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    };
  }

  async findPayout(id: string): Promise<PayoutResponseDto> {
    const payout = await this.payoutRepository.findOne({
      where: { id },
      relations: ['carrier'],
    });
    if (!payout) {
      throw new NotFoundException('Payout not found');
    }
    return this.mapPayoutToResponse(payout, payout.carrier);
  }

  async processPayout(id: string): Promise<PayoutResponseDto> {
    const payout = await this.payoutRepository.findOne({
      where: { id },
      relations: ['carrier'],
    });
    if (!payout) {
      throw new NotFoundException('Payout not found');
    }

    if (payout.status !== 'pending') {
      throw new BadRequestException('Payout is not in pending status');
    }

    payout.status = 'processing';
    await this.payoutRepository.save(payout);
    return this.mapPayoutToResponse(payout, payout.carrier);
  }

  async completePayout(id: string): Promise<PayoutResponseDto> {
    const payout = await this.payoutRepository.findOne({
      where: { id },
      relations: ['carrier'],
    });
    if (!payout) {
      throw new NotFoundException('Payout not found');
    }

    if (payout.status !== 'processing') {
      throw new BadRequestException('Payout is not in processing status');
    }

    payout.status = 'completed';
    payout.completedAt = new Date();
    await this.payoutRepository.save(payout);
    return this.mapPayoutToResponse(payout, payout.carrier);
  }

  async getSummary(): Promise<PaymentSummaryDto> {
    const invoices = await this.invoiceRepository.find();
    const payouts = await this.payoutRepository.find();

    const totalInvoiced = invoices.reduce((sum, i) => sum + Number(i.amountUsd), 0);
    const totalPaid = invoices
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + Number(i.amountUsd), 0);
    const totalPending = invoices
      .filter(i => i.status === 'pending')
      .reduce((sum, i) => sum + Number(i.amountUsd), 0);
    const totalOverdue = invoices
      .filter(i => i.status === 'overdue')
      .reduce((sum, i) => sum + Number(i.amountUsd), 0);

    const totalPayoutsCompleted = payouts
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + Number(p.amountUsd), 0);
    const totalPayoutsPending = payouts
      .filter(p => p.status === 'pending' || p.status === 'processing')
      .reduce((sum, p) => sum + Number(p.amountUsd), 0);

    return {
      invoices: {
        total: totalInvoiced,
        paid: totalPaid,
        pending: totalPending,
        overdue: totalOverdue,
        count: invoices.length,
      },
      payouts: {
        completed: totalPayoutsCompleted,
        pending: totalPayoutsPending,
        count: payouts.length,
      },
      netPosition: totalPaid - totalPayoutsCompleted,
    };
  }

  async getCarrierSummary(carrierId: string) {
    const carrier = await this.carrierRepository.findOne({ where: { id: carrierId } });
    if (!carrier) {
      throw new NotFoundException('Carrier not found');
    }

    const invoices = await this.invoiceRepository.find({ where: { carrierId } });
    const payouts = await this.payoutRepository.find({ where: { carrierId } });

    const totalEarned = invoices.reduce((sum, i) => sum + Number(i.amountUsd), 0);
    const totalPaid = payouts
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + Number(p.amountUsd), 0);
    const pendingPayment = totalEarned - totalPaid;

    return {
      carrierId,
      carrierName: carrier.name,
      totalEarned,
      totalPaid,
      pendingPayment,
      invoiceCount: invoices.length,
      payoutCount: payouts.length,
    };
  }

  private mapInvoiceToResponse(invoice: Invoice, carrier?: Carrier): InvoiceResponseDto {
    return {
      id: invoice.id,
      loadId: invoice.loadId,
      carrierId: invoice.carrierId,
      amountUsd: Number(invoice.amountUsd),
      dueDate: invoice.dueDate,
      status: invoice.status,
      createdAt: invoice.createdAt,
      paidAt: invoice.paidAt,
      carrier: carrier ? {
        id: carrier.id,
        name: carrier.name,
      } : undefined,
    };
  }

  private mapPayoutToResponse(payout: Payout, carrier?: Carrier): PayoutResponseDto {
    return {
      id: payout.id,
      carrierId: payout.carrierId,
      invoiceId: payout.invoiceId,
      amountUsd: Number(payout.amountUsd),
      method: payout.method,
      status: payout.status,
      createdAt: payout.createdAt,
      completedAt: payout.completedAt,
      carrier: carrier ? {
        id: carrier.id,
        name: carrier.name,
      } : undefined,
    };
  }
}
