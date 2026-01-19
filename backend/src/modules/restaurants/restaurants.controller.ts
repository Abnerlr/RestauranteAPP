import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { BootstrapDto } from './dto/bootstrap.dto';
import { BootstrapResponseDto } from './dto/bootstrap-response.dto';

@Controller('api/v1/restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Post('bootstrap')
  @HttpCode(HttpStatus.CREATED)
  async bootstrap(@Body() bootstrapDto: BootstrapDto): Promise<BootstrapResponseDto> {
    return this.restaurantsService.bootstrap(bootstrapDto);
  }
}
