using System.Runtime.InteropServices;
using System.Text.Json;
using System.Text.Json.Serialization;
using GoldenLine.Desktop.Services;

namespace GoldenLine.Desktop.Bridge;

[ComVisible(true)]
[ClassInterface(ClassInterfaceType.AutoDual)]
public class BridgeService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter() }
    };

    private readonly AuthService _authService;
    private readonly InventoryService _inventoryService;
    private readonly EquipmentService _equipmentService;
    private readonly EquipmentImageService _equipmentImageService;
    private readonly LocationService _locationService;
    private readonly SupplierService _supplierService;
    private readonly ProjectService _projectService;
    private readonly ShipmentService _shipmentService;
    private readonly LogisticsService _logisticsService;
    private readonly FlowService _flowService;
    private readonly MediaService _mediaService;
    private readonly CapacityService _capacityService;
    private readonly PersonnelService _personnelService;
    private readonly DailyStatusService _dailyStatusService;
    private readonly PersonnelReportsService _personnelReportsService;
    private readonly ManagementOverviewService _managementOverviewService;
    private readonly ExportService _exportService;
    private readonly ImportService _importService;

    public BridgeService(
        AuthService? authService = null,
        InventoryService? inventoryService = null,
        EquipmentService? equipmentService = null,
        EquipmentImageService? equipmentImageService = null,
        LocationService? locationService = null,
        SupplierService? supplierService = null,
        ProjectService? projectService = null,
        ShipmentService? shipmentService = null,
        LogisticsService? logisticsService = null,
        FlowService? flowService = null,
        MediaService? mediaService = null,
        CapacityService? capacityService = null,
        PersonnelService? personnelService = null,
        DailyStatusService? dailyStatusService = null,
        PersonnelReportsService? personnelReportsService = null,
        ManagementOverviewService? managementOverviewService = null,
        ExportService? exportService = null,
        ImportService? importService = null)
    {
        _authService = authService ?? new AuthService();
        _inventoryService = inventoryService ?? new InventoryService();
        _equipmentService = equipmentService ?? new EquipmentService();
        _equipmentImageService = equipmentImageService ?? new EquipmentImageService();
        _locationService = locationService ?? new LocationService();
        _supplierService = supplierService ?? new SupplierService();
        _projectService = projectService ?? new ProjectService();
        _shipmentService = shipmentService ?? new ShipmentService();
        _logisticsService = logisticsService ?? new LogisticsService();
        _flowService = flowService ?? new FlowService();
        _mediaService = mediaService ?? new MediaService();
        _capacityService = capacityService ?? new CapacityService();
        _personnelService = personnelService ?? new PersonnelService();
        _dailyStatusService = dailyStatusService ?? new DailyStatusService();
        _personnelReportsService = personnelReportsService ?? new PersonnelReportsService();
        _managementOverviewService = managementOverviewService ?? new ManagementOverviewService();
        _exportService = exportService ?? new ExportService();
        _importService = importService ?? new ImportService();
    }

    [ComVisible(true)]
    public async Task<string> LoginAsync(string requestJson)
    {
        var request = Deserialize<LoginRequest>(requestJson) ?? new LoginRequest();
        var data = await _authService.LoginAsync(request);
        return Serialize(data);
    }

    [ComVisible(true)]
    public async Task<string> RegisterAsync(string requestJson)
    {
        var request = Deserialize<RegisterRequest>(requestJson) ?? new RegisterRequest();
        var data = await _authService.RegisterAsync(request);
        return Serialize(data);
    }

    [ComVisible(true)]
    public async Task<string> GetUsersAsync()
    {
        var data = await _authService.GetUsersAsync();
        return Serialize(data);
    }

    [ComVisible(true)]
    public async Task<string> DeleteUserAsync(int id)
    {
        await _authService.DeleteUserAsync(id);
        return Serialize(new { success = true });
    }

    [ComVisible(true)]
    public async Task<string> UpdateUserRoleAsync(int id, string requestJson)
    {
        var request = Deserialize<UpdateUserRoleRequest>(requestJson) ?? new UpdateUserRoleRequest();
        await _authService.UpdateRoleAsync(id, request);
        return Serialize(new { success = true });
    }

    [ComVisible(true)]
    public async Task<string> ResetUserPasswordAsync(int id, string requestJson)
    {
        var request = Deserialize<ResetUserPasswordRequest>(requestJson) ?? new ResetUserPasswordRequest();
        await _authService.ResetPasswordAsync(id, request);
        return Serialize(new { success = true });
    }

    [ComVisible(true)]
    public async Task<string> GetAssignmentsAsync(int? personnelId, int? itemId, bool activeOnly = true)
    {
        var data = await _inventoryService.GetAssignmentsAsync(personnelId, itemId, activeOnly);
        return Serialize(data);
    }

    [ComVisible(true)]
    public async Task<string> GetMovementsAsync(int? itemId, int? personnelId, int take = 200)
    {
        var data = await _inventoryService.GetMovementsAsync(itemId, personnelId, take);
        return Serialize(data);
    }

    [ComVisible(true)]
    public async Task<string> GetLocationsAsync()
    {
        var data = await _inventoryService.GetLocationsAsync();
        return Serialize(data);
    }

    [ComVisible(true)]
    public async Task<string> GetScrapLossReportAsync(string filtersJson)
    {
        var filters = Deserialize<ScrapLossReportFilterDto>(filtersJson) ?? new ScrapLossReportFilterDto();
        var data = await _inventoryService.GetScrapLossReportAsync(filters);
        return Serialize(data);
    }

    [ComVisible(true)]
    public async Task<string> GetStockOverviewAsync(int? locationId, string? search)
    {
        var data = await _inventoryService.GetStockOverviewAsync(locationId, search);
        return Serialize(data);
    }

    [ComVisible(true)]
    public async Task<string> GetCriticalStockAsync(int? locationId, string? search)
    {
        var data = await _inventoryService.GetCriticalStockAsync(locationId, search);
        return Serialize(data);
    }

    [ComVisible(true)]
    public async Task<string> GetActiveAssignmentsAsync(int? itemId, int? personnelId, string? aging, string? assignedFromIso, string? assignedToIso)
    {
        var assignedFrom = TryParseDate(assignedFromIso);
        var assignedTo = TryParseDate(assignedToIso);
        var data = await _inventoryService.GetActiveAssignmentsAsync(itemId, personnelId, aging, assignedFrom, assignedTo);
        return Serialize(data);
    }

    [ComVisible(true)]
    public async Task<string> CreateInventoryCountSessionAsync(string requestJson)
    {
        var request = Deserialize<CreateInventoryCountSessionRequest>(requestJson) ?? new CreateInventoryCountSessionRequest();
        var data = await _inventoryService.CreateInventoryCountSessionAsync(request);
        return Serialize(data);
    }

    [ComVisible(true)]
    public async Task<string> GetInventoryCountSessionsAsync()
    {
        var data = await _inventoryService.GetInventoryCountSessionsAsync();
        return Serialize(data);
    }

    [ComVisible(true)]
    public async Task<string> GetInventoryCountSessionAsync(int sessionId)
    {
        var data = await _inventoryService.GetInventoryCountSessionAsync(sessionId);
        return Serialize(data);
    }

    [ComVisible(true)]
    public async Task<string> UpdateCountLineAsync(int sessionId, int lineId, string requestJson)
    {
        var request = Deserialize<UpdateInventoryCountLineRequest>(requestJson) ?? new UpdateInventoryCountLineRequest();
        await _inventoryService.UpdateCountLineAsync(sessionId, lineId, request);
        return Serialize(new { success = true });
    }

    [ComVisible(true)]
    public async Task<string> FinalizeCountSessionAsync(int sessionId)
    {
        var data = await _inventoryService.FinalizeCountSessionAsync(sessionId);
        return Serialize(data);
    }

    [ComVisible(true)]
    public async Task<string> DeleteCountSessionAsync(int sessionId)
    {
        await _inventoryService.DeleteInventoryCountSessionAsync(sessionId);
        return Serialize(new { success = true });
    }

    [ComVisible(true)]
    public async Task<string> GetInventoryMovementReportAsync(string filtersJson)
    {
        var filters = Deserialize<InventoryMovementReportFilterDto>(filtersJson) ?? new InventoryMovementReportFilterDto();
        var data = await _inventoryService.GetInventoryMovementReportAsync(filters);
        return Serialize(data);
    }

    [ComVisible(true)]
    public async Task<string> AssignToPersonnelAsync(string requestJson)
    {
        var request = Deserialize<InventoryOutRequest>(requestJson) ?? new InventoryOutRequest();
        var data = await _inventoryService.AssignToPersonnelAsync(request);
        return Serialize(data);
    }

    [ComVisible(true)]
    public async Task<string> ReturnFromPersonnelAsync(string requestJson)
    {
        var request = Deserialize<InventoryInRequest>(requestJson) ?? new InventoryInRequest();
        var data = await _inventoryService.ReturnFromPersonnelAsync(request);
        return Serialize(data);
    }

    [ComVisible(true)]
    public async Task<string> ScrapAsync(string requestJson)
    {
        var request = Deserialize<InventoryAdjustmentRequest>(requestJson) ?? new InventoryAdjustmentRequest();
        var data = await _inventoryService.ScrapAsync(request);
        return Serialize(data);
    }

    [ComVisible(true)]
    public async Task<string> LostAsync(string requestJson)
    {
        var request = Deserialize<InventoryAdjustmentRequest>(requestJson) ?? new InventoryAdjustmentRequest();
        var data = await _inventoryService.LostAsync(request);
        return Serialize(data);
    }

    [ComVisible(true)]
    public async Task<string> BackfillLocationStocksAsync()
    {
        var data = await _inventoryService.BackfillLocationStocksAsync();
        return Serialize(data);
    }

    [ComVisible(true)]
    public async Task<string> GetEquipmentItemsAsync()
    {
        var data = await _equipmentService.GetEquipmentItemsAsync();
        return Serialize(data);
    }

    [ComVisible(true)]
    public async Task<string> GetEquipmentItemAsync(int id)
    {
        var data = await _equipmentService.GetEquipmentItemAsync(id);
        return Serialize(data);
    }

    [ComVisible(true)]
    public async Task<string> CreateEquipmentItemAsync(string requestJson)
    {
        var request = Deserialize<EquipmentItemRequest>(requestJson) ?? new EquipmentItemRequest();
        var data = await _equipmentService.CreateEquipmentItemAsync(request);
        return Serialize(data);
    }

    [ComVisible(true)]
    public async Task<string> UpdateEquipmentItemAsync(int id, string requestJson)
    {
        var request = Deserialize<EquipmentItemRequest>(requestJson) ?? new EquipmentItemRequest();
        await _equipmentService.UpdateEquipmentItemAsync(id, request);
        return Serialize(new { success = true });
    }

    [ComVisible(true)]
    public async Task<string> DeleteEquipmentItemAsync(int id)
    {
        await _equipmentService.DeleteEquipmentItemAsync(id);
        return Serialize(new { success = true });
    }

    [ComVisible(true)]
    public async Task<string> ImportEquipmentCsvAsync(string csvContent)
    {
        var data = await _equipmentService.ImportFromCsvAsync(csvContent ?? string.Empty);
        return Serialize(data);
    }

    [ComVisible(true)]
    public async Task<string> GetEquipmentImageAsync(string sku)
    {
        var data = await _equipmentImageService.GetEquipmentImageAsync(sku);
        return Serialize(data);
    }

    [ComVisible(true)]
    public async Task<string> GetLocationCatalogAsync()
    {
        var data = await _locationService.GetLocationsAsync();
        return Serialize(data);
    }

    [ComVisible(true)]
    public async Task<string> CreateLocationAsync(string requestJson)
    {
        var request = Deserialize<CreateLocationRequest>(requestJson) ?? new CreateLocationRequest();
        var data = await _locationService.CreateLocationAsync(request);
        return Serialize(data);
    }

    [ComVisible(true)]
    public async Task<string> UpdateLocationAsync(int id, string requestJson)
    {
        var request = Deserialize<UpdateLocationRequest>(requestJson) ?? new UpdateLocationRequest();
        await _locationService.UpdateLocationAsync(id, request);
        return Serialize(new { success = true });
    }

    [ComVisible(true)]
    public async Task<string> DeleteLocationAsync(int id)
    {
        await _locationService.DeleteLocationAsync(id);
        return Serialize(new { success = true });
    }

    [ComVisible(true)]
    public async Task<string> GetSuppliersAsync(bool includeInactive)
    {
        var data = await _supplierService.GetSuppliersAsync(includeInactive);
        return Serialize(data);
    }

    [ComVisible(true)]
    public async Task<string> CreateSupplierAsync(string requestJson)
    {
        var request = Deserialize<SupplierRequest>(requestJson) ?? new SupplierRequest();
        var data = await _supplierService.CreateSupplierAsync(request);
        return Serialize(data);
    }

    [ComVisible(true)]
    public async Task<string> UpdateSupplierAsync(int id, string requestJson)
    {
        var request = Deserialize<SupplierRequest>(requestJson) ?? new SupplierRequest();
        await _supplierService.UpdateSupplierAsync(id, request);
        return Serialize(new { success = true });
    }

    [ComVisible(true)]
    public async Task<string> DeleteSupplierAsync(int id)
    {
        await _supplierService.DeleteSupplierAsync(id);
        return Serialize(new { success = true });
    }

    [ComVisible(true)]
    public async Task<string> GetProjectsAsync()
    {
        var data = await _projectService.GetProjectsAsync();
        return Serialize(data);
    }

    [ComVisible(true)]
    public async Task<string> GetShipmentsAsync()
    {
        var data = await _shipmentService.GetShipmentsAsync();
        return Serialize(data);
    }

    [ComVisible(true)]
    public async Task<string> GetProjectAsync(int id)
    {
        var data = await _projectService.GetProjectAsync(id);
        return Serialize(data);
    }

    [ComVisible(true)]
    public async Task<string> CreateProjectAsync(string requestJson, string? actor)
    {
        var request = Deserialize<ProjectCreateRequest>(requestJson) ?? new ProjectCreateRequest();
        var data = await _projectService.CreateProjectAsync(request, actor);
        return Serialize(data);
    }

    [ComVisible(true)]
    public async Task<string> CreateShipmentAsync(string requestJson)
    {
        var request = Deserialize<ShipmentCreateRequest>(requestJson) ?? new ShipmentCreateRequest();
        var data = await _shipmentService.CreateShipmentAsync(request);
        return Serialize(data);
    }

    [ComVisible(true)]
    public async Task<string> UpdateShipmentAsync(int id, string requestJson)
    {
        var request = Deserialize<ShipmentUpdateRequest>(requestJson) ?? new ShipmentUpdateRequest();
        var data = await _shipmentService.UpdateShipmentAsync(id, request);
        return Serialize(data);
    }

    [ComVisible(true)]
    public async Task<string> GetLogisticsStateAsync()
    {
        var data = await _logisticsService.GetLogisticsStateAsync();
        return Serialize(data);
    }

    [ComVisible(true)]
    public async Task<string> CreateLogisticsProductAsync(string requestJson)
    {
        var request = Deserialize<LogisticsProductCreateRequest>(requestJson) ?? new LogisticsProductCreateRequest();
        var data = await _logisticsService.CreateLogisticsProductAsync(request);
        return Serialize(data);
    }

    [ComVisible(true)]
    public async Task<string> CreateLogisticsProductsAsync(string requestJson)
    {
        var request = Deserialize<List<LogisticsProductCreateRequest>>(requestJson)
            ?? new List<LogisticsProductCreateRequest>();
        var data = await _logisticsService.CreateLogisticsProductsAsync(request);
        return Serialize(data);
    }

    [ComVisible(true)]
    public async Task<string> UpdateLogisticsProductAsync(string id, string requestJson)
    {
        var request = Deserialize<LogisticsProductUpdateRequest>(requestJson) ?? new LogisticsProductUpdateRequest();
        var data = await _logisticsService.UpdateLogisticsProductAsync(id, request);
        return Serialize(data);
    }

    [ComVisible(true)]
    public async Task<string> DeleteLogisticsProductAsync(string id)
    {
        await _logisticsService.DeleteLogisticsProductAsync(id);
        return Serialize(new { success = true });
    }

    [ComVisible(true)]
    public async Task<string> CreateLogisticsCrateAsync(string requestJson)
    {
        var request = Deserialize<LogisticsCrateCreateRequest>(requestJson) ?? new LogisticsCrateCreateRequest();
        var data = await _logisticsService.CreateCrateAsync(request);
        return Serialize(data);
    }

    [ComVisible(true)]
    public async Task<string> UpdateLogisticsCrateAsync(string id, string requestJson)
    {
        var request = Deserialize<LogisticsCrateUpdateRequest>(requestJson) ?? new LogisticsCrateUpdateRequest();
        var data = await _logisticsService.UpdateCrateAsync(id, request);
        return Serialize(data);
    }

    [ComVisible(true)]
    public async Task<string> DeleteLogisticsCrateAsync(string id)
    {
        await _logisticsService.DeleteCrateAsync(id);
        return Serialize(new { success = true });
    }

    [ComVisible(true)]
    public async Task<string> CreateLogisticsContainerAsync(string requestJson)
    {
        var request = Deserialize<LogisticsContainerCreateRequest>(requestJson) ?? new LogisticsContainerCreateRequest();
        var data = await _logisticsService.CreateContainerAsync(request);
        return Serialize(data);
    }

    [ComVisible(true)]
    public async Task<string> DeleteLogisticsContainerAsync(string id)
    {
        await _logisticsService.DeleteContainerAsync(id);
        return Serialize(new { success = true });
    }

    [ComVisible(true)]
    public async Task<string> DeleteProjectAsync(int id)
    {
        await _projectService.DeleteProjectAsync(id);
        return Serialize(new { success = true });
    }

    [ComVisible(true)]
    public async Task<string> GetFlowAsync(int projectId, string? parentNodeId)
    {
        var data = await _flowService.GetFlowAsync(projectId, parentNodeId);
        return Serialize(data);
    }

    [ComVisible(true)]
    public async Task<string> SaveFlowAsync(int projectId, string flowDataJson, string? actor)
    {
        var payload = Deserialize<FlowDataDto>(flowDataJson) ?? new FlowDataDto();
        await _flowService.SaveFlowAsync(projectId, payload, actor);
        return Serialize(new { success = true });
    }

    [ComVisible(true)]
    public async Task<string> UploadNodeImageAsync(string requestJson)
    {
        var request = Deserialize<NodeImageUploadRequest>(requestJson) ?? new NodeImageUploadRequest();
        var data = await _mediaService.UploadNodeImageAsync(request);
        return Serialize(data);
    }

    [ComVisible(true)]
    public async Task<string> UploadShipmentCratePhotosAsync(string requestJson)
    {
        var request = Deserialize<ShipmentCratePhotoUploadRequest>(requestJson) ?? new ShipmentCratePhotoUploadRequest();
        var data = await _mediaService.UploadShipmentCratePhotosAsync(request);
        return Serialize(data);
    }

    [ComVisible(true)]
    public Task<string> DeleteShipmentCratePhotosAsync(string requestJson)
    {
        var request = Deserialize<ShipmentCratePhotoDeleteRequest>(requestJson) ?? new ShipmentCratePhotoDeleteRequest();
        var data = _mediaService.DeleteShipmentCratePhotos(request);
        return Task.FromResult(Serialize(data));
    }

    [ComVisible(true)]
    public Task<string> GetShipmentCratePhotoAsync(string requestJson)
    {
        var request = Deserialize<ShipmentCratePhotoFetchRequest>(requestJson) ?? new ShipmentCratePhotoFetchRequest();
        var data = _mediaService.GetShipmentCratePhoto(request);
        return Task.FromResult(Serialize(data));
    }

    [ComVisible(true)]
    public async Task<string> GetPeopleCapacityAsync(string? startDateIso, string? endDateIso)
    {
        var startDate = TryParseDate(startDateIso);
        var endDate = TryParseDate(endDateIso);
        var data = await _capacityService.GetPeopleCapacityAsync(startDate, endDate);
        return Serialize(data);
    }

    [ComVisible(true)]
    public Task<string> GetMachineReservationsAsync(string? machineName)
    {
        var data = Array.Empty<MachineReservationDto>();
        return Task.FromResult(Serialize(data));
    }

    [ComVisible(true)]
    public Task<string> CalculateScenarioAsync(string requestJson)
    {
        var request = Deserialize<ScenarioRequestDto>(requestJson) ?? new ScenarioRequestDto();
        var data = _capacityService.CalculateScenario(request);
        return Task.FromResult(Serialize(data));
    }

    [ComVisible(true)]
    public async Task<string> GetPersonnelAsync(string queryJson)
    {
        var query = Deserialize<PersonnelListQuery>(queryJson) ?? new PersonnelListQuery();
        var data = await _personnelService.GetPersonnelAsync(query);
        return Serialize(data);
    }

    [ComVisible(true)]
    public async Task<string> GetPersonnelDetailAsync(int id)
    {
        var data = await _personnelService.GetPersonnelDetailAsync(id);
        return Serialize(data);
    }

    [ComVisible(true)]
    public async Task<string> CreatePersonnelAsync(string requestJson)
    {
        var request = Deserialize<PersonnelRequest>(requestJson) ?? new PersonnelRequest();
        var data = await _personnelService.CreatePersonnelAsync(request);
        return Serialize(data);
    }

    [ComVisible(true)]
    public async Task<string> BulkCreatePersonnelAsync(string requestJson)
    {
        var requests = Deserialize<List<PersonnelRequest>>(requestJson) ?? new List<PersonnelRequest>();
        var data = await _personnelService.BulkCreatePersonnelAsync(requests);
        return Serialize(data);
    }

    [ComVisible(true)]
    public async Task<string> UpdatePersonnelAsync(int id, string requestJson)
    {
        var request = Deserialize<PersonnelRequest>(requestJson) ?? new PersonnelRequest();
        await _personnelService.UpdatePersonnelAsync(id, request);
        return Serialize(new { success = true });
    }

    [ComVisible(true)]
    public async Task<string> DeletePersonnelAsync(int id)
    {
        await _personnelService.DeletePersonnelAsync(id);
        return Serialize(new { success = true });
    }

    [ComVisible(true)]
    public async Task<string> GetDailyStatusesAsync(string queryJson)
    {
        var query = Deserialize<DailyStatusQuery>(queryJson) ?? new DailyStatusQuery();
        var data = await _dailyStatusService.GetDailyStatusesAsync(query);
        return Serialize(data);
    }

    [ComVisible(true)]
    public async Task<string> BulkUpsertDailyStatusesAsync(string requestJson)
    {
        var request = Deserialize<DailyStatusBulkRequest>(requestJson) ?? new DailyStatusBulkRequest();
        var data = await _dailyStatusService.BulkUpsertStatusesAsync(request);
        return Serialize(data);
    }

    [ComVisible(true)]
    public async Task<string> CreateDailyStatusAsync(string requestJson)
    {
        var request = Deserialize<DailyStatusRequest>(requestJson) ?? new DailyStatusRequest();
        var data = await _dailyStatusService.CreateStatusAsync(request);
        return Serialize(data);
    }

    [ComVisible(true)]
    public async Task<string> UpdateDailyStatusAsync(int id, string requestJson)
    {
        var request = Deserialize<DailyStatusRequest>(requestJson) ?? new DailyStatusRequest();
        await _dailyStatusService.UpdateStatusAsync(id, request);
        return Serialize(new { success = true });
    }

    [ComVisible(true)]
    public async Task<string> DeleteDailyStatusAsync(int id)
    {
        await _dailyStatusService.DeleteStatusAsync(id);
        return Serialize(new { success = true });
    }

    [ComVisible(true)]
    public async Task<string> GetPersonnelReportOverviewAsync(string queryJson)
    {
        var query = Deserialize<PersonnelReportQuery>(queryJson) ?? new PersonnelReportQuery();
        var data = await _personnelReportsService.GetOverviewAsync(query);
        return Serialize(data);
    }

    [ComVisible(true)]
    public async Task<string> GetManagementOverviewAsync()
    {
        var data = await _managementOverviewService.GetOverviewAsync();
        return Serialize(data);
    }

    [ComVisible(true)]
    public async Task<string> ExportMsProjectAsync(int projectId)
    {
        var data = await _exportService.ExportToMsProjectAsync(projectId);
        return Serialize(data);
    }

    [ComVisible(true)]
    public async Task<string> ImportMsProjectAsync(int projectId, string xmlContent)
    {
        var data = await _importService.ImportFromMsProjectAsync(projectId, xmlContent);
        return Serialize(data);
    }

    private static string Serialize<T>(T value)
    {
        return JsonSerializer.Serialize(value, JsonOptions);
    }

    private static T? Deserialize<T>(string json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return default;
        }

        return JsonSerializer.Deserialize<T>(json, JsonOptions);
    }

    private static DateTime? TryParseDate(string? value)
    {
        return DateTime.TryParse(value, out var parsed) ? parsed : null;
    }
}

public class MachineReservationDto
{
    public int MachineReservationId { get; set; }
    public string MachineName { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public string? Location { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
}

