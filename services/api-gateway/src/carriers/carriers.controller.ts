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
import { CarriersService } from './carriers.service';
import { CreateCarrierDto, UpdateCarrierDto, CarrierResponseDto, CreateDriverDto, DriverResponseDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('carriers')
@Controller('carriers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CarriersController {
  constructor(private readonly carriersService: CarriersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new carrier' })
  @ApiResponse({ status: 201, description: 'Carrier created successfully', type: CarrierResponseDto })
  async createCarrier(@Body() createCarrierDto: CreateCarrierDto): Promise<CarrierResponseDto> {
    return this.carriersService.create(createCarrierDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all carriers with optional filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'equipment', required: false, type: String })
  @ApiQuery({ name: 'minScore', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Carriers retrieved successfully' })
  async getCarriers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('equipment') equipment?: string,
    @Query('minScore') minScore?: number,
  ) {
    return this.carriersService.findAll({ page, limit, equipment, minScore });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific carrier by ID' })
  @ApiResponse({ status: 200, description: 'Carrier retrieved successfully', type: CarrierResponseDto })
  async getCarrier(@Param('id') id: string): Promise<CarrierResponseDto> {
    return this.carriersService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a carrier' })
  @ApiResponse({ status: 200, description: 'Carrier updated successfully', type: CarrierResponseDto })
  async updateCarrier(
    @Param('id') id: string,
    @Body() updateCarrierDto: UpdateCarrierDto,
  ): Promise<CarrierResponseDto> {
    return this.carriersService.update(id, updateCarrierDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a carrier' })
  @ApiResponse({ status: 204, description: 'Carrier deleted successfully' })
  async deleteCarrier(@Param('id') id: string): Promise<void> {
    return this.carriersService.remove(id);
  }

  @Post(':id/drivers')
  @ApiOperation({ summary: 'Add a driver to a carrier' })
  @ApiResponse({ status: 201, description: 'Driver added successfully', type: DriverResponseDto })
  async addDriver(
    @Param('id') carrierId: string,
    @Body() createDriverDto: CreateDriverDto,
  ): Promise<DriverResponseDto> {
    return this.carriersService.addDriver(carrierId, createDriverDto);
  }

  @Get(':id/drivers')
  @ApiOperation({ summary: 'Get all drivers for a carrier' })
  @ApiResponse({ status: 200, description: 'Drivers retrieved successfully' })
  async getDrivers(@Param('id') carrierId: string): Promise<DriverResponseDto[]> {
    return this.carriersService.getDrivers(carrierId);
  }

  @Delete(':carrierId/drivers/:driverId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a driver from a carrier' })
  @ApiResponse({ status: 204, description: 'Driver removed successfully' })
  async removeDriver(
    @Param('carrierId') carrierId: string,
    @Param('driverId') driverId: string,
  ): Promise<void> {
    return this.carriersService.removeDriver(carrierId, driverId);
  }
}
