import { Injectable, Logger } from '@nestjs/common';

export interface IPFSResolveResult {
  originalUrl: string;
  resolvedUrl: string;
  isResolved: boolean;
  gateway: string;
}

@Injectable()
export class IPFSResolverService {
  private readonly logger = new Logger(IPFSResolverService.name);

  // List of IPFS gateways to try (in order of preference)
  private readonly gateways = [
    'https://gateway.pinata.cloud/ipfs/',
    'https://ipfs.io/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://dweb.link/ipfs/',
    'https://ipfs.fleek.co/ipfs/',
  ];

  /**
   * Check if a URL is an IPFS URL
   */
  isIPFSUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    return url.startsWith('ipfs://') || url.includes('/ipfs/');
  }

  /**
   * Extract IPFS hash from various IPFS URL formats
   */
  extractIPFSHash(url: string): string | null {
    if (!url) return null;

    // Handle ipfs:// format
    if (url.startsWith('ipfs://')) {
      return url.replace('ipfs://', '');
    }

    // Handle /ipfs/ format
    const ipfsMatch = url.match(/\/ipfs\/([^\/\?]+)/);
    if (ipfsMatch) {
      return ipfsMatch[1];
    }

    return null;
  }

  /**
   * Resolve IPFS URL to HTTP URL using available gateways
   */
  async resolveIPFSUrl(ipfsUrl: string): Promise<IPFSResolveResult> {
    if (!this.isIPFSUrl(ipfsUrl)) {
      return {
        originalUrl: ipfsUrl,
        resolvedUrl: ipfsUrl,
        isResolved: false,
        gateway: 'none',
      };
    }

    const hash = this.extractIPFSHash(ipfsUrl);
    if (!hash) {
      this.logger.warn(`Could not extract IPFS hash from URL: ${ipfsUrl}`);
      return {
        originalUrl: ipfsUrl,
        resolvedUrl: ipfsUrl,
        isResolved: false,
        gateway: 'none',
      };
    }

    // Try each gateway in order
    for (const gateway of this.gateways) {
      try {
        const resolvedUrl = `${gateway}${hash}`;

        // Test if the gateway can resolve the content
        const isAccessible = await this.testGateway(resolvedUrl);
        if (isAccessible) {
          this.logger.debug(`Successfully resolved IPFS URL using ${gateway}`);
          return {
            originalUrl: ipfsUrl,
            resolvedUrl,
            isResolved: true,
            gateway: gateway.replace('/ipfs/', ''),
          };
        }
      } catch (error) {
        this.logger.debug(
          `Gateway ${gateway} failed for hash ${hash}: ${error.message}`,
        );
      }
    }

    // If all gateways fail, return the first gateway URL anyway
    const fallbackUrl = `${this.gateways[0]}${hash}`;
    this.logger.warn(
      `All gateways failed for IPFS hash ${hash}, using fallback: ${fallbackUrl}`,
    );

    return {
      originalUrl: ipfsUrl,
      resolvedUrl: fallbackUrl,
      isResolved: false,
      gateway: this.gateways[0].replace('/ipfs/', ''),
    };
  }

  /**
   * Test if a gateway can access the IPFS content
   */
  private async testGateway(url: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(url, {
        method: 'HEAD', // Only check headers, don't download content
        signal: controller.signal,
        headers: {
          'User-Agent': 'NFT-Agent/1.0',
        },
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Resolve multiple IPFS URLs in batch
   */
  async resolveIPFSUrls(urls: string[]): Promise<IPFSResolveResult[]> {
    const results = await Promise.allSettled(
      urls.map((url) => this.resolveIPFSUrl(url)),
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        this.logger.error(
          `Failed to resolve IPFS URL ${urls[index]}: ${result.reason}`,
        );
        return {
          originalUrl: urls[index],
          resolvedUrl: urls[index],
          isResolved: false,
          gateway: 'error',
        };
      }
    });
  }

  /**
   * Resolve IPFS URLs in NFT metadata
   */
  async resolveNFTMetadata(nftMetadata: any): Promise<any> {
    if (!nftMetadata) return nftMetadata;

    const urlsToResolve: string[] = [];
    const urlPaths: string[] = [];

    // Find all potential IPFS URLs in the metadata
    const findIPFSUrls = (obj: any, path: string = '') => {
      if (typeof obj === 'string' && this.isIPFSUrl(obj)) {
        urlsToResolve.push(obj);
        urlPaths.push(path);
      } else if (typeof obj === 'object' && obj !== null) {
        Object.keys(obj).forEach((key) => {
          findIPFSUrls(obj[key], path ? `${path}.${key}` : key);
        });
      }
    };

    findIPFSUrls(nftMetadata);

    if (urlsToResolve.length === 0) {
      return nftMetadata;
    }

    // Resolve all IPFS URLs
    const resolvedResults = await this.resolveIPFSUrls(urlsToResolve);

    // Create a deep copy of the metadata
    const resolvedMetadata = JSON.parse(JSON.stringify(nftMetadata));

    // Replace IPFS URLs with resolved URLs
    resolvedResults.forEach((result, index) => {
      if (result.isResolved) {
        const path = urlPaths[index];
        this.setNestedValue(resolvedMetadata, path, result.resolvedUrl);
        this.logger.debug(
          `Resolved IPFS URL in ${path}: ${result.originalUrl} -> ${result.resolvedUrl}`,
        );
      }
    });

    return resolvedMetadata;
  }

  /**
   * Set a nested value in an object using dot notation
   */
  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
  }
}
