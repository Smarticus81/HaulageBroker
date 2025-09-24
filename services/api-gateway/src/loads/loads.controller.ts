import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LoadsService } from './loads.service';
import { CreateLoadDto, UpdateLoadDto, LoadResponseDto, LoadsListResponseDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('loads')
@Controller('loads')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LoadsController {
  constructor(private readonly loadsService: LoadsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new load' })
  @ApiResponse({ status: 201, description: 'Load created successfully', type: LoadResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createLoad(@Body() createLoadDto: CreateLoadDto): Promise<LoadResponseDto> {
    return this.loadsService.createLoad(createLoadDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all loads with pagination' })
  @ApiResponse({ status: 200, description: 'Loads retrieved successfully', type: LoadsListResponseDto })
  async getLoads(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status?: string,
    @Query('shipper_id') shipperId?: string,
  ): Promise<LoadsListResponseDto> {
    return this.loadsService.getLoads({ page, limit, status, shipperId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific load by ID' })
  @ApiResponse({ status: 200, description: 'Load retrieved successfully', type: LoadResponseDto })
  @ApiResponse({ status: 404, description: 'Load not found' })
  async getLoad(@Param('id') id: string): Promise<LoadResponseDto> {
    return this.loadsService.getLoad(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a load' })
  @ApiResponse({ status: 200, description: 'Load updated successfully', type: LoadResponseDto })
  @ApiResponse({ status: 404, description: 'Load not found' })
  async updateLoad(
    @Param('id') id: string,
    @Body() updateLoadDto: UpdateLoadDto,
  ): Promise<LoadResponseDto> {
    return this.loadsService.updateLoad(id, updateLoadDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a load' })
  @ApiResponse({ status: 204, description: 'Load deleted successfully' })
  @ApiResponse({ status: 404, description: 'Load not found' })
  async deleteLoad(@Param('id') id: string): Promise<void> {
    return this.loadsService.deleteLoad(id);
  }

  @Post(':id/quote')
  @ApiOperation({ summary: 'Request a quote for a load' })
  @ApiResponse({ status: 201, description: 'Quote requested successfully' })
  async requestQuote(@Param('id') id: string): Promise<{ message: string }> {
    await this.loadsService.requestQuote(id);
    return { message: 'Quote request submitted successfully' };
  }

  @Post(':id/tender')
  @ApiOperation({ summary: 'Create tender for a load' })
  @ApiResponse({ status: 201, description: 'Tender created successfully' })
  async createTender(
    @Param('id') id: string,
    @Body() tenderData: { carrier_id: string; price_usd: number; expires_at: string },
  ): Promise<{ message: string; tender_id: string }> {
    const tenderId = await this.loadsService.createTender(id, tenderData);
    return { message: 'Tender created successfully', tender_id: tenderId };
  }
}
