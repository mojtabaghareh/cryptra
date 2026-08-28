import { activityFeed } from '@cryptra/global-activity';

export class GlobalActivityAppService {
  async feed(limit = 30) {
    return activityFeed.list(limit);
  }
}

export const globalActivityService = new GlobalActivityAppService();
