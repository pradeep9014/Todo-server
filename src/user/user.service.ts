import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';


@Injectable()
export class UserService {

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {

  }

  async findByUsername(username: string) {
    return this.userRepository.findOne({
      where: { username: username },
    });
  }

  async findById(id: string) {
    return this.userRepository.findOne({
      where: { id },
    });
  }

  async create(userData: Partial<User>) {
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }
}
