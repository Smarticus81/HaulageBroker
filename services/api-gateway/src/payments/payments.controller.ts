import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import {
  CreateInvoiceDto,
  CreatePayoutDto,
  InvoiceResponseDto,
  PayoutResponseDto,
  PaymentSummaryDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // Invoice endpoints
  @Post('invoices')
  @ApiOperation({ summary: 'Create a new invoice for a load' })
  @ApiResponse({ status: 201, description: 'Invoice created successfully', type: InvoiceResponseDto })
  async createInvoice(@Body() dto: CreateInvoiceDto): Promise<InvoiceResponseDto> {
    return this.paymentsService.createInvoice(dto);
  }

  @Get('invoices')
  @ApiOperation({ summary: 'Get all invoices with filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'carrierId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Invoices retrieved successfully' })
  async getInvoices(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('carrierId') carrierId?: string,
    @Query('status') status?: string,
  ) {
    return this.paymentsService.findAllInvoices({ page, limit, carrierId, status });
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Get a specific invoice by ID' })
  @ApiResponse({ status: 200, description: 'Invoice retrieved', type: InvoiceResponseDto })
  async getInvoice(@Param('id') id: string): Promise<InvoiceResponseDto> {
    return this.paymentsService.findInvoice(id);
  }

  @Put('invoices/:id/pay')
  @ApiOperation({ summary: 'Mark an invoice as paid' })
  @ApiResponse({ status: 200, description: 'Invoice marked as paid', type: InvoiceResponseDto })
  async markInvoicePaid(@Param('id') id: string): Promise<InvoiceResponseDto> {
    return this.paymentsService.markInvoicePaid(id);
  }

  // Payout endpoints
  @Post('payouts')
  @ApiOperation({ summary: 'Create a payout to a carrier' })
  @ApiResponse({ status: 201, description: 'Payout created', type: PayoutResponseDto })
  async createPayout(@Body() dto: CreatePayoutDto): Promise<PayoutResponseDto> {
    return this.paymentsService.createPayout(dto);
  }

  @Get('payouts')
  @ApiOperation({ summary: 'Get all payouts with filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'carrierId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Payouts retrieved successfully' })
  async getPayouts(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('carrierId') carrierId?: string,
    @Query('status') status?: string,
  ) {
    return this.paymentsService.findAllPayouts({ page, limit, carrierId, status });
  }

  @Get('payouts/:id')
  @ApiOperation({ summary: 'Get a specific payout by ID' })
  @ApiResponse({ status: 200, description: 'Payout retrieved', type: PayoutResponseDto })
  async getPayout(@Param('id') id: string): Promise<PayoutResponseDto> {
    return this.paymentsService.findPayout(id);
  }

  @Put('payouts/:id/process')
  @ApiOperation({ summary: 'Start processing a payout' })
  @ApiResponse({ status: 200, description: 'Payout processing started', type: PayoutResponseDto })
  async processPayout(@Param('id') id: string): Promise<PayoutResponseDto> {
    return this.paymentsService.processPayout(id);
  }

  @Put('payouts/:id/complete')
  @ApiOperation({ summary: 'Mark a payout as completed' })
  @ApiResponse({ status: 200, description: 'Payout completed', type: PayoutResponseDto })
  async completePayout(@Param('id') id: string): Promise<PayoutResponseDto> {
    return this.paymentsService.completePayout(id);
  }

  // Summary endpoints
  @Get('summary')
  @ApiOperation({ summary: 'Get payment summary statistics' })
  @ApiResponse({ status: 200, description: 'Summary retrieved', type: PaymentSummaryDto })
  async getSummary(): Promise<PaymentSummaryDto> {
    return this.paymentsService.getSummary();
  }

  @Get('carrier/:carrierId/summary')
  @ApiOperation({ summary: 'Get payment summary for a specific carrier' })
  @ApiResponse({ status: 200, description: 'Carrier summary retrieved' })
  async getCarrierSummary(@Param('carrierId') carrierId: string) {
    return this.paymentsService.getCarrierSummary(carrierId);
  }
}
