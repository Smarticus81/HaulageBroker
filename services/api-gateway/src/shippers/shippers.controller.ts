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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ShippersService } from './shippers.service';
import { CreateShipperDto, UpdateShipperDto, ShipperResponseDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('shippers')
@Controller('shippers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ShippersController {
  constructor(private readonly shippersService: ShippersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new shipper' })
  @ApiResponse({ status: 201, description: 'Shipper created successfully', type: ShipperResponseDto })
  async createShipper(@Body() createShipperDto: CreateShipperDto): Promise<ShipperResponseDto> {
    return this.shippersService.create(createShipperDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all shippers with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Shippers retrieved successfully' })
  async getShippers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('search') search?: string,
  ) {
    return this.shippersService.findAll({ page, limit, search });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific shipper by ID' })
  @ApiResponse({ status: 200, description: 'Shipper retrieved successfully', type: ShipperResponseDto })
  async getShipper(@Param('id') id: string): Promise<ShipperResponseDto> {
    return this.shippersService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a shipper' })
  @ApiResponse({ status: 200, description: 'Shipper updated successfully', type: ShipperResponseDto })
  async updateShipper(
    @Param('id') id: string,
    @Body() updateShipperDto: UpdateShipperDto,
  ): Promise<ShipperResponseDto> {
    return this.shippersService.update(id, updateShipperDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a shipper' })
  @ApiResponse({ status: 204, description: 'Shipper deleted successfully' })
  async deleteShipper(@Param('id') id: string): Promise<void> {
    return this.shippersService.remove(id);
  }

  @Get(':id/loads')
  @ApiOperation({ summary: 'Get all loads for a shipper' })
  @ApiResponse({ status: 200, description: 'Loads retrieved successfully' })
  async getShipperLoads(@Param('id') id: string) {
    return this.shippersService.getLoads(id);
  }
}
