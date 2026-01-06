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
import { TendersService } from './tenders.service';
import { CreateTenderDto, TenderResponseDto, AcceptTenderDto, AwardResponseDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('tenders')
@Controller('tenders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TendersController {
  constructor(private readonly tendersService: TendersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tender for a carrier' })
  @ApiResponse({ status: 201, description: 'Tender created successfully', type: TenderResponseDto })
  async createTender(@Body() createTenderDto: CreateTenderDto): Promise<TenderResponseDto> {
    return this.tendersService.create(createTenderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tenders with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'loadId', required: false, type: String })
  @ApiQuery({ name: 'carrierId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Tenders retrieved successfully' })
  async getTenders(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('loadId') loadId?: string,
    @Query('carrierId') carrierId?: string,
    @Query('status') status?: string,
  ) {
    return this.tendersService.findAll({ page, limit, loadId, carrierId, status });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific tender by ID' })
  @ApiResponse({ status: 200, description: 'Tender retrieved successfully', type: TenderResponseDto })
  async getTender(@Param('id') id: string): Promise<TenderResponseDto> {
    return this.tendersService.findOne(id);
  }

  @Put(':id/accept')
  @ApiOperation({ summary: 'Accept a tender and create an award' })
  @ApiResponse({ status: 200, description: 'Tender accepted and award created', type: AwardResponseDto })
  async acceptTender(
    @Param('id') id: string,
    @Body() acceptTenderDto: AcceptTenderDto,
  ): Promise<AwardResponseDto> {
    return this.tendersService.accept(id, acceptTenderDto);
  }

  @Put(':id/decline')
  @ApiOperation({ summary: 'Decline a tender' })
  @ApiResponse({ status: 200, description: 'Tender declined', type: TenderResponseDto })
  async declineTender(@Param('id') id: string): Promise<TenderResponseDto> {
    return this.tendersService.decline(id);
  }

  @Get('load/:loadId')
  @ApiOperation({ summary: 'Get all tenders for a specific load' })
  @ApiResponse({ status: 200, description: 'Tenders retrieved successfully' })
  async getTendersForLoad(@Param('loadId') loadId: string): Promise<TenderResponseDto[]> {
    return this.tendersService.findByLoad(loadId);
  }

  @Get('carrier/:carrierId')
  @ApiOperation({ summary: 'Get all tenders for a specific carrier' })
  @ApiResponse({ status: 200, description: 'Tenders retrieved successfully' })
  async getTendersForCarrier(@Param('carrierId') carrierId: string): Promise<TenderResponseDto[]> {
    return this.tendersService.findByCarrier(carrierId);
  }
}
