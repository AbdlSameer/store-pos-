"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var bcryptjs_1 = __importDefault(require("bcryptjs"));
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var hashed, admin, categoriesData, categories, productsData, _i, productsData_1, p;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🌱 Starting seed...');
                    return [4 /*yield*/, bcryptjs_1.default.hash('password123', 10)];
                case 1:
                    hashed = _a.sent();
                    return [4 /*yield*/, prisma.user.upsert({
                            where: { email: 'admin@toystore.com' },
                            update: {},
                            create: {
                                email: 'admin@toystore.com',
                                passwordHash: hashed,
                                fullName: 'Super Admin',
                                role: 'super_admin'
                            }
                        })];
                case 2:
                    admin = _a.sent();
                    categoriesData = [
                        { name: 'Action Figures', slug: 'action-figures' },
                        { name: 'Board Games', slug: 'board-games' },
                        { name: 'Educational', slug: 'educational' },
                        { name: 'Puzzles', slug: 'puzzles' },
                        { name: 'Vehicles', slug: 'vehicles' },
                        { name: 'SOFT TOYS', slug: 'soft-toys' },
                        { name: 'ELECTRONIC TOYS', slug: 'electronic-toys' },
                        { name: 'ART STUDIO', slug: 'art-studio' },
                        { name: 'SPORTS', slug: 'sports' },
                        { name: 'BABY RIDERS', slug: 'baby-riders' },
                        { name: 'RAINCOATS', slug: 'raincoats' },
                        { name: 'STATIONERY', slug: 'stationery' }
                    ];
                    return [4 /*yield*/, Promise.all(categoriesData.map(function (c) {
                            return prisma.category.upsert({
                                where: { slug: c.slug },
                                update: {},
                                create: c
                            });
                        }))];
                case 3:
                    categories = _a.sent();
                    productsData = [
                        { sku: 'ACT-001', name: 'Superhero Action Figure', price: 999.99, quantity: 50, categoryId: categories[0].id },
                        { sku: 'BRD-001', name: 'Monopoly Classic', price: 1499.00, quantity: 30, categoryId: categories[1].id },
                        { sku: 'EDU-001', name: 'Science Kit', price: 2499.50, quantity: 5, categoryId: categories[2].id },
                        { sku: 'PUZ-001', name: '1000 Piece Landscape', price: 799.00, quantity: 15, categoryId: categories[3].id },
                        { sku: 'VEH-001', name: 'Remote Control Car', price: 1999.00, quantity: 8, categoryId: categories[4].id },
                    ];
                    _i = 0, productsData_1 = productsData;
                    _a.label = 4;
                case 4:
                    if (!(_i < productsData_1.length)) return [3 /*break*/, 7];
                    p = productsData_1[_i];
                    return [4 /*yield*/, prisma.product.upsert({
                            where: { sku: p.sku },
                            update: {},
                            create: __assign(__assign({}, p), { createdBy: admin.id })
                        })];
                case 5:
                    _a.sent();
                    _a.label = 6;
                case 6:
                    _i++;
                    return [3 /*break*/, 4];
                case 7:
                    console.log('✅ Seed complete');
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error(e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
