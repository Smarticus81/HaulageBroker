import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto, QuoteResponseDto, CalculateRateDto, RateResponseDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('quotes')
@Controller('quotes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new quote for a load' })
  @ApiResponse({ status: 201, description: 'Quote created successfully', type: QuoteResponseDto })
  async createQuote(@Body() createQuoteDto: CreateQuoteDto): Promise<QuoteResponseDto> {
    return this.quotesService.create(createQuoteDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all quotes with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'loadId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Quotes retrieved successfully' })
  async getQuotes(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('loadId') loadId?: string,
  ) {
    return this.quotesService.findAll({ page, limit, loadId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific quote by ID' })
  @ApiResponse({ status: 200, description: 'Quote retrieved successfully', type: QuoteResponseDto })
  async getQuote(@Param('id') id: string): Promise<QuoteResponseDto> {
    return this.quotesService.findOne(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a quote' })
  @ApiResponse({ status: 204, description: 'Quote deleted successfully' })
  async deleteQuote(@Param('id') id: string): Promise<void> {
    return this.quotesService.remove(id);
  }

  @Post('calculate')
  @ApiOperation({ summary: 'Calculate a rate for a given lane and equipment' })
  @ApiResponse({ status: 200, description: 'Rate calculated', type: RateResponseDto })
  async calculateRate(@Body() calculateRateDto: CalculateRateDto): Promise<RateResponseDto> {
    return this.quotesService.calculateRate(calculateRateDto);
  }
}
