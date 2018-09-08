"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var VolumeHeaderComponent = /** @class */ (function () {
    function VolumeHeaderComponent(rest, route, router) {
        this.rest = rest;
        this.route = route;
        this.router = router;
        this.volumes = [];
    }
    VolumeHeaderComponent.prototype.ngOnInit = function () {
        this.getVolumes();
    };
    VolumeHeaderComponent.prototype.getVolumes = function () {
        var _this = this;
        this.volumes = [];
        this.rest.getVolumes().subscribe(function (data) {
            console.log(data);
            _this.volumes = data[0];
        });
    };
    VolumeHeaderComponent = __decorate([
        core_1.Component({
            selector: 'app-volumes',
            templateUrl: './volumes.component.html',
            styleUrls: ['./volumes.component.css']
        })
    ], VolumeHeaderComponent);
    return VolumeHeaderComponent;
}());
exports.VolumeHeaderComponent = VolumeHeaderComponent;
