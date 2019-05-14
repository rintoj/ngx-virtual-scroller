import { Component, Input, HostBinding } from '@angular/core';

export interface ListItem {
	id: string;
    index: number;
    name: string;
    gender: string;
    age: number;
    email: string;
    phone: string;
    address: string;
	company: string;
}

@Component({
    selector: 'list-item',
    template: `
        <div class="avatar">{{item.index}}</div>
        <div class="item-content">
            <div class="name">{{item.name}}</div>
            <div>
                <span class="badge">{{item.age}}/{{item.gender.substr(0, 1).toUpperCase()}}</span>
                <span>{{item.email}} | {{item.phone}}</span>
            </div>
            <div>{{item.address}}</div>
        </div>
    `,
    styleUrls: ['./list-item.scss']
})
export class ListItemComponent {
    @Input()
    public item: ListItem;

    @Input()
    public randomWidth: boolean = false;

    @Input()
    public randomHeight: boolean = false;

  @HostBinding('style.width')
  public get styleWidth(): string {
    if (!this.randomWidth)
    {
      return undefined;
    }

    return (100 + this.stringToHash(this.item.name) % 900).toString() + 'px';
  }

  private static Seed: number;
  public static ResetSeed(): void {
	ListItemComponent.Seed = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
  }  
  
  @HostBinding('style.height')
  public get styleHeight(): string {
    if (!this.randomHeight) {
      return undefined;
    }

    return (50 + this.stringToHash(this.item.name) % 450).toString() + 'px';
  }

  @HostBinding('style.border')
  public get styleBorder(): string {
    if (!this.randomWidth && !this.randomHeight) {
      return undefined;
    }

    return '1px solid black';
  }

  private stringToHash(text: string): number {
    return [].reduce.call(text, (accumulator, character) => (accumulator << 5) - accumulator + character.charCodeAt(0), 0) ^ ListItemComponent.Seed;
  }
}
ListItemComponent.ResetSeed();