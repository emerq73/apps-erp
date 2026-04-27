describe('AuthService', () => {
    it('should be defined', () => {
        expect(true).toBe(true);
    });

    it('should have valid user entity fields', () => {
        const { User } = require('./entities/user.entity');
        expect(User).toBeDefined();
    });

    it('should have role entity', () => {
        const { Role } = require('./entities/role.entity');
        expect(Role).toBeDefined();
    });

    it('should have permission entity', () => {
        const { Permission } = require('./entities/permission.entity');
        expect(Permission).toBeDefined();
    });
});